import { ProductListView } from "@/components/product-list-view"

export default function ProductsPage() {
  return (
    <ProductListView
      showHeader={true}
      title="Products"
      description="Browse and purchase from our catalog"
    />
  )
}
