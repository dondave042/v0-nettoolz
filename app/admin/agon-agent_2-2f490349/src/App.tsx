"use client"

import { useState } from "react"
import Dashboard from "./components/Dashboard"
import Analytics from "./components/Analytics"
import ProductsTable from "./components/ProductsTable"
import Settings from "./components/Settings"
import Sidebar from "./components/Sidebar"
import UploadProduct from "./components/UploadProduct"
import { mockProducts } from "./data/mockData"
import { AdminTab, Product } from "./types"

interface AppProps {
    initialTab?: AdminTab
}

export default function App({ initialTab = "dashboard" }: AppProps) {
    const [activeTab, setActiveTab] = useState<AdminTab>(initialTab)
    const [products, setProducts] = useState<Product[]>(mockProducts)

    const handleAddProduct = (product: Product) => {
        setProducts((previous) => [product, ...previous])
        setActiveTab("products")
    }

    const handleDeleteProduct = (id: string) => {
        setProducts((previous) => previous.filter((product) => product.id !== id))
    }

    const handleUpdateProduct = (product: Product) => {
        setProducts((previous) => previous.map((entry) => (entry.id === product.id ? product : entry)))
    }

    function renderContent() {
        switch (activeTab) {
            case "products":
                return <ProductsTable products={products} onDeleteProduct={handleDeleteProduct} onUpdateProduct={handleUpdateProduct} />
            case "upload":
                return <UploadProduct onAddProduct={handleAddProduct} />
            case "analytics":
                return <Analytics products={products} />
            case "settings":
                return <Settings />
            case "dashboard":
            default:
                return <Dashboard products={products} />
        }
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[120px]" />
                <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[120px]" />
                <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[150px]" />
            </div>
            <div className="pointer-events-none fixed inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="relative z-10 ml-[260px] min-h-screen">
                <div className="mx-auto max-w-[1400px] p-8">{renderContent()}</div>
            </main>
        </div>
    )
}