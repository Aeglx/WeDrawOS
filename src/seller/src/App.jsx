import React from 'react'
import Router from './router'
import SellerLayout from './components/layout/SellerLayout'
import Home from './pages/Home'
import GoodsList from './pages/GoodsList'
    <div className="App">
      <Router />
    </div>
import OrdersList from './pages/OrdersList'
import AfterSale from './pages/AfterSale'
import CouponList from './pages/CouponList'
import Settlement from './pages/Settlement'
import ShopSettings from './pages/ShopSettings'
import Staff from './pages/Staff'
import Role from './pages/Role'
import BrandList from './pages/BrandList'
import CategoryList from './pages/CategoryList'
import FlashSale from './pages/FlashSale'
import FullDiscount from './pages/FullDiscount'
import FinanceBill from './pages/FinanceBill'
import GoodsDetail from './pages/GoodsDetail'
import OrderDetail from './pages/OrderDetail'
import MemberStats from './pages/stats/MemberStats'
import OrderStats from './pages/stats/OrderStats'
import ProductStats from './pages/stats/ProductStats'
import TrafficStats from './pages/stats/TrafficStats'

function RequireAuth({ children }) {
  const token = localStorage.getItem('sellerToken')
  const location = useLocation()
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <RequireAuth>
          <SellerLayout />
        </RequireAuth>
      }>
        <Route index element={<Home />} />
        <Route path="goods/list" element={<GoodsList />} />
        <Route path="goods/publish" element={<PublishGoods />} />
        <Route path="goods/brand" element={<BrandList />} />
        <Route path="goods/category" element={<CategoryList />} />
        <Route path="goods/detail/:id" element={<GoodsDetail />} />
        <Route path="orders/list" element={<OrdersList />} />
        <Route path="orders/after-sale" element={<AfterSale />} />
        <Route path="orders/detail/:orderNo" element={<OrderDetail />} />
        <Route path="promotion/coupon" element={<CouponList />} />
        <Route path="promotion/flash" element={<FlashSale />} />
        <Route path="promotion/full-discount" element={<FullDiscount />} />
        <Route path="finance/settlement" element={<Settlement />} />
        <Route path="finance/bill" element={<FinanceBill />} />
        <Route path="settings/shop" element={<ShopSettings />} />
        <Route path="settings/staff" element={<Staff />} />
        <Route path="settings/role" element={<Role />} />
        <Route path="statistics/member" element={<MemberStats />} />
        <Route path="statistics/order" element={<OrderStats />} />
        <Route path="statistics/product" element={<ProductStats />} />
        <Route path="statistics/traffic" element={<TrafficStats />} />
      </Route>
    </Routes>
  )
}