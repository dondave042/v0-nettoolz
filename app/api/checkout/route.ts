import { NextResponse } from 'next/server'
import { getBuyerSession } from '@/lib/buyer-auth'
import {
    ensureCredentialsInventoryTables,
    ensureLegacyProductCredentialInventory,
    ensureOrderCredentialsTable,
} from '@/lib/credentials-inventory'
import { getDb } from '@/lib/db'
import { PaymentStatus } from '@/lib/payment-status'
import { applyBuyerBalanceDelta } from '@/lib/schema-compat'
import {
    CheckoutError,
    ValidationError,
} from '@/lib/payment-errors'

type CheckoutItemInput = {
    product_id: number
    productId?: number
    id?: number
    quantity: number
}

type PreparedCheckoutItem = {
    productId: number
    quantity: number
    totalPrice: number
    product: Record<string, any>
}

function isBalanceCheckoutMethod(methodType: string | null | undefined) {
    const normalized = String(methodType || '').trim().toLowerCase()
    return normalized === 'dashboard' || normalized === 'balance' || normalized === 'wallet'
}

async function assignCredentialsToOrder(sql: ReturnType<typeof getDb>, orderId: number | string, buyerId: number, productId: number, quantity: number) {
    await ensureOrderCredentialsTable()
    await ensureLegacyProductCredentialInventory(sql, productId)

    const credentials = await sql`
    SELECT id FROM buyer_credentials_inventory
    WHERE product_id = ${productId} AND assigned_to_buyer_id IS NULL
    LIMIT ${quantity}
  `

    if (credentials.length < quantity) {
        throw new ValidationError(
            `Not enough credentials available. Available: ${credentials.length}, Requested: ${quantity}`
        )
    }

    for (const credential of credentials as Array<{ id: number }>) {
        await sql`
      UPDATE buyer_credentials_inventory
      SET assigned_to_buyer_id = ${buyerId}, assigned_at = NOW()
      WHERE id = ${credential.id}
    `

        await sql`
      INSERT INTO order_credentials (order_id, credential_id)
      VALUES (${orderId}, ${credential.id})
      ON CONFLICT (order_id, credential_id) DO NOTHING
    `
    }
}

async function createOrderRecord(sql: ReturnType<typeof getDb>, input: {
    buyerId: number
    buyerEmail: string
    productId: number
    quantity: number
    totalPrice: number
    paymentMethodId: number
    paymentMethodType: string | null
    paymentReference: string
    paymentStatus: PaymentStatus
}) {
    const orderTableColumns = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders'
  `

    const columnSet = new Set(
        orderTableColumns.map((row: { column_name: string }) => row.column_name)
    )

    const hasBuyerId = columnSet.has('buyer_id')
    const hasUserId = columnSet.has('user_id')
    const hasProductId = columnSet.has('product_id')
    const hasQuantity = columnSet.has('quantity')
    const hasTotalPrice = columnSet.has('total_price')
    const hasTotal = columnSet.has('total')
    const hasPaymentMethodId = columnSet.has('payment_method_id')
    const hasCheckoutMethod = columnSet.has('checkout_method')
    const hasPaymentStatus = columnSet.has('payment_status')
    const hasPaymentReferenceId = columnSet.has('payment_reference_id')
    const hasBuyerEmail = columnSet.has('buyer_email')

    let orders: any[] = []

    if (
        hasBuyerId &&
        hasProductId &&
        hasQuantity &&
        hasTotalPrice &&
        hasPaymentMethodId &&
        hasPaymentStatus &&
        hasPaymentReferenceId
    ) {
        if (hasBuyerEmail && hasCheckoutMethod) {
            orders = await sql`
        INSERT INTO orders (
          buyer_id,
          buyer_email,
          product_id,
          quantity,
          total_price,
          payment_method_id,
          checkout_method,
          status,
          payment_status,
          payment_reference_id,
          payment_completed_at
        )
        VALUES (
          ${input.buyerId},
          ${input.buyerEmail},
          ${input.productId},
          ${input.quantity},
          ${input.totalPrice},
          ${input.paymentMethodId},
          ${input.paymentMethodType},
          ${input.paymentStatus === PaymentStatus.COMPLETED ? 'completed' : 'pending'},
          ${input.paymentStatus},
          ${input.paymentReference},
          ${input.paymentStatus === PaymentStatus.COMPLETED ? new Date() : null}
        )
        RETURNING id, buyer_id, product_id, quantity, total_price, payment_method_id, status, payment_status, payment_reference_id, created_at
      `
        } else {
            orders = await sql`
        INSERT INTO orders (
          buyer_id,
          product_id,
          quantity,
          total_price,
          payment_method_id,
          status,
          payment_status,
          payment_reference_id,
          payment_completed_at
        )
        VALUES (
          ${input.buyerId},
          ${input.productId},
          ${input.quantity},
          ${input.totalPrice},
          ${input.paymentMethodId},
          ${input.paymentStatus === PaymentStatus.COMPLETED ? 'completed' : 'pending'},
          ${input.paymentStatus},
          ${input.paymentReference},
          ${input.paymentStatus === PaymentStatus.COMPLETED ? new Date() : null}
        )
        RETURNING id, buyer_id, product_id, quantity, total_price, payment_method_id, status, payment_status, payment_reference_id, created_at
      `
        }
    } else if (hasUserId && hasTotal && !hasBuyerId) {
        throw new CheckoutError(
            'Orders table still uses legacy user_id schema. Run buyer/payment migrations before checkout.'
        )
    } else if (hasUserId && hasTotal) {
        orders = await sql`
      INSERT INTO orders (user_id, total)
      VALUES (${input.buyerId}, ${input.totalPrice})
      RETURNING id, user_id, total, created_at
    `
    } else {
        throw new CheckoutError(
            'Orders table is missing required columns. Run latest payment/order migrations.'
        )
    }

    if (!orders || orders.length === 0) {
        throw new CheckoutError('Failed to create order in database')
    }

    return orders[0]
}

export async function POST(request: Request) {
    const buyer = await getBuyerSession()

    if (!buyer) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { product_id, quantity, payment_method_id, items } = await request.json()
        const parsedPaymentMethodId = Number(payment_method_id)
        const requestedItems = Array.isArray(items) && items.length > 0
            ? items
            : [{ product_id, quantity }]

        if (!parsedPaymentMethodId || requestedItems.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields: items/product_id, quantity, payment_method_id' },
                { status: 400 }
            )
        }

        if (!Number.isInteger(parsedPaymentMethodId) || parsedPaymentMethodId <= 0) {
            throw new ValidationError('Payment method ID must be a positive integer')
        }

        const normalizedItems = requestedItems.map((item: CheckoutItemInput) => ({
            productId: Number(item.product_id ?? item.productId ?? item.id),
            quantity: Number(item.quantity),
        }))

        if (normalizedItems.some((item) => !Number.isInteger(item.productId) || item.productId <= 0)) {
            throw new ValidationError('Each product ID must be a positive integer')
        }

        if (normalizedItems.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100)) {
            throw new ValidationError('Each quantity must be an integer between 1 and 100')
        }

        const totalUnits = normalizedItems.reduce((sum, item) => sum + item.quantity, 0)
        if (totalUnits > 100) {
            throw new ValidationError('You can checkout at most 100 total units at once')
        }

        const sql = getDb()
        await ensureCredentialsInventoryTables()

        // Check available credentials across legacy and current inventory schemas.
        const credentialColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'buyer_credentials_inventory'
    `

        const credentialColumnSet = new Set(
            credentialColumns.map((row: { column_name: string }) => row.column_name)
        )

        // Get payment method
        const methods = await sql`
      SELECT id, name, type FROM payment_methods WHERE id = ${parsedPaymentMethodId} AND is_active = true
    `

        if (methods.length === 0) {
            throw new ValidationError('Invalid or inactive payment method')
        }

        const checkoutMethod = methods[0]?.type || methods[0]?.name || null
        const isDashboardCheckout = isBalanceCheckoutMethod(checkoutMethod)
        const paymentReference = `${isDashboardCheckout ? 'DBAL' : 'ORD'}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

        const preparedItems: PreparedCheckoutItem[] = []

        for (const item of normalizedItems) {
            const products = await sql`
        SELECT id, name, price, available_qty FROM products WHERE id = ${item.productId}
      `

            if (products.length === 0) {
                throw new ValidationError(`Product ${item.productId} not found`)
            }

            const product = products[0]

            if (Number(product.available_qty) < item.quantity) {
                throw new ValidationError(
                    `Not enough inventory for ${product.name}. Available: ${product.available_qty}, Requested: ${item.quantity}`
                )
            }

            let availableCredentials = Number(product.available_qty)

            if (credentialColumnSet.size > 0) {
                await ensureLegacyProductCredentialInventory(sql, item.productId)
                let credentialCount: any[] = []

                if (credentialColumnSet.has('assigned_to_buyer_id')) {
                    credentialCount = await sql`
            SELECT COUNT(*) as count FROM buyer_credentials_inventory
            WHERE product_id = ${item.productId} AND assigned_to_buyer_id IS NULL
          `
                } else if (credentialColumnSet.has('distributed_to_buyer_id')) {
                    credentialCount = await sql`
            SELECT COUNT(*) as count FROM buyer_credentials_inventory
            WHERE product_id = ${item.productId} AND distributed_to_buyer_id IS NULL
          `
                } else if (credentialColumnSet.has('is_distributed')) {
                    credentialCount = await sql`
            SELECT COUNT(*) as count FROM buyer_credentials_inventory
            WHERE product_id = ${item.productId} AND COALESCE(is_distributed, false) = false
          `
                } else {
                    credentialCount = await sql`
            SELECT COUNT(*) as count FROM buyer_credentials_inventory
            WHERE product_id = ${item.productId}
          `
                }

                availableCredentials = Number(credentialCount[0]?.count ?? 0)
            }

            if (availableCredentials < item.quantity) {
                throw new ValidationError(
                    `Not enough credentials available for ${product.name}. Available: ${availableCredentials}, Requested: ${item.quantity}`
                )
            }

            preparedItems.push({
                productId: item.productId,
                quantity: item.quantity,
                totalPrice: parseFloat(product.price) * item.quantity,
                product,
            })
        }

        const grandTotal = preparedItems.reduce((sum, item) => sum + item.totalPrice, 0)

        if (isDashboardCheckout) {
            const buyerRows = await sql`
        SELECT balance FROM buyers WHERE id = ${buyer.id} LIMIT 1
      `
            const buyerBalance = Number(buyerRows[0]?.balance ?? 0)

            if (buyerBalance < grandTotal) {
                throw new ValidationError(`Insufficient dashboard balance. Available: ${buyerBalance}, Required: ${grandTotal}`)
            }
        }

        const createdOrders = []
        for (const item of preparedItems) {
            const order = await createOrderRecord(sql, {
                buyerId: buyer.id,
                buyerEmail: buyer.email,
                productId: item.productId,
                quantity: item.quantity,
                totalPrice: item.totalPrice,
                paymentMethodId: parsedPaymentMethodId,
                paymentMethodType: checkoutMethod,
                paymentReference,
                paymentStatus: isDashboardCheckout ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
            })

            if (isDashboardCheckout) {
                await assignCredentialsToOrder(sql, order.id, buyer.id, item.productId, item.quantity)
                await sql`
          UPDATE products
          SET available_qty = available_qty - ${item.quantity}
          WHERE id = ${item.productId}
        `
            }

            createdOrders.push(order)
        }

        if (isDashboardCheckout) {
            await applyBuyerBalanceDelta(sql, buyer.id, -grandTotal)
        }

        return NextResponse.json(
            {
                order: {
                    id: createdOrders[0].id,
                    product_id: createdOrders[0].product_id ?? preparedItems[0].productId,
                    quantity: createdOrders[0].quantity ?? preparedItems[0].quantity,
                    total_price: createdOrders[0].total_price ?? createdOrders[0].total ?? preparedItems[0].totalPrice,
                    payment_method_id: createdOrders[0].payment_method_id ?? parsedPaymentMethodId,
                    status: createdOrders[0].status,
                    payment_status: createdOrders[0].payment_status ?? (isDashboardCheckout ? PaymentStatus.COMPLETED : PaymentStatus.PENDING),
                    payment_reference_id: createdOrders[0].payment_reference_id ?? paymentReference,
                    created_at: createdOrders[0].created_at,
                },
                orders: createdOrders.map((order, index) => ({
                    id: order.id,
                    product_id: order.product_id ?? preparedItems[index].productId,
                    quantity: order.quantity ?? preparedItems[index].quantity,
                    total_price: order.total_price ?? order.total ?? preparedItems[index].totalPrice,
                    payment_method_id: order.payment_method_id ?? parsedPaymentMethodId,
                    status: order.status,
                    payment_status: order.payment_status ?? (isDashboardCheckout ? PaymentStatus.COMPLETED : PaymentStatus.PENDING),
                    payment_reference_id: order.payment_reference_id ?? paymentReference,
                    created_at: order.created_at,
                })),
                total_price: grandTotal,
                payment_reference_id: paymentReference,
                completed: isDashboardCheckout,
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('[Checkout] Error creating order:', error)

        if (error instanceof ValidationError) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            )
        }

        if (error instanceof CheckoutError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.statusCode }
            )
        }

        const errorMessage = error instanceof Error ? error.message : String(error)
        return NextResponse.json(
            { error: `Failed to create order: ${errorMessage}` },
            { status: 500 }
        )
    }
}

export async function GET(request: Request) {
    const buyer = await getBuyerSession()

    if (!buyer) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const sql = getDb()

        // Get buyer's orders
        const orders = await sql`
      SELECT 
        o.id, o.product_id, o.quantity, o.total_price, o.status, 
        o.payment_method_id, o.created_at,
        o.payment_status, o.payment_error_message, o.payment_reference_id,
        p.name as product_name, p.price,
        pm.name as payment_method_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN payment_methods pm ON o.payment_method_id = pm.id
      WHERE o.buyer_id = ${buyer.id}
      ORDER BY o.created_at DESC
    `

        return NextResponse.json({ orders })
    } catch (error) {
        console.error('Get orders error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        )
    }
}
