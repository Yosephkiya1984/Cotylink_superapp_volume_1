import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Search, ShoppingCart, ChevronRight, 
  ShieldCheck, Package, AlertTriangle, CheckCircle2, X, MapPin, Clock, Truck
} from 'lucide-react';
import { useGlobalState } from '../../context/GlobalStateContext';
import { api } from '../../../services/api';
import { Product, Order } from '../../../types';

const Marketplace: React.FC = () => {
  const { setView, profile, setProfile } = useGlobalState();
  const [view, setLocalView] = useState<'LIST' | 'PRODUCT' | 'ORDERS' | 'ORDER_DETAIL'>('LIST');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [confirmationCode, setConfirmationCode] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeInput, setShowDisputeInput] = useState(false);

  const categories = ['All', 'Electronics', 'Fashion', 'Home', 'Food', 'Beauty', 'Sports', 'Books', 'Other'];
  const districts = ['Bole', 'Arada', 'Kirkos', 'Gullele', 'Lideta', 'Yeka'];

  useEffect(() => {
    setConfirmationCode('');
    setDisputeReason('');
    setShowDisputeInput(false);
  }, [selectedOrder]);

  useEffect(() => {
    if (view === 'LIST') loadProducts();
    if (view === 'ORDERS') loadOrders();
  }, [view]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getMarketplaceProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const data = await api.getUserOrders(profile.id);
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setLocalView('PRODUCT');
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setLocalView('ORDER_DETAIL');
  };

  const handleBuy = async () => {
    if (!profile || !selectedProduct) return;
    
    if (profile.balance !== undefined && profile.balance < selectedProduct.price) {
      alert("Insufficient balance. Please top up your wallet.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.createOrder(profile.id, selectedProduct.id, 1);
      if (res.success) {
        const updatedProfile = await api.getProfile(profile.id);
        setProfile({ ...updatedProfile, isLoggedIn: true });
        setLocalView('ORDERS');
      } else {
        alert(res.error || "Failed to place order.");
      }
    } catch (error) {
      console.error("Buy error:", error);
      alert("An error occurred.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!selectedOrder) return;
    if (!confirmationCode) {
      alert("Please enter the confirmation code sent by the merchant.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.confirmDelivery(selectedOrder.id, confirmationCode);
      if (res.success) {
        loadOrders();
        setLocalView('ORDERS');
      } else {
        alert(res.error || "Failed to confirm delivery. Please check the code.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to confirm delivery.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async () => {
    if (!selectedOrder) return;
    if (!showDisputeInput) {
      setShowDisputeInput(true);
      return;
    }
    if (!disputeReason) {
      alert("Please enter a reason for the dispute.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.raiseDispute(selectedOrder.id, disputeReason);
      if (res.success) {
        loadOrders();
        setLocalView('ORDERS');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const renderProductList = () => (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="space-y-8"
    >
      {/* Editorial Hero */}
      <div className="relative h-48 rounded-[2.5rem] overflow-hidden group">
        <img 
          src="https://picsum.photos/seed/addis/1200/600" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          alt="Addis Marketplace" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-8">
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Addis<br/>Market</h2>
          <p className="text-emerald-400 font-mono text-[10px] uppercase tracking-[0.3em] mt-2">Escrow Protected Trading</p>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products in Addis..."
            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-5 outline-none focus:border-emerald-500/50 transition-all text-sm backdrop-blur-sm"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat 
                ? 'bg-emerald-500 text-slate-950' 
                : 'bg-slate-900 text-slate-400 border border-white/5 hover:border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((p, idx) => (
            <motion.button 
              key={p.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleProductSelect(p)}
              className="bg-slate-900/30 border border-white/5 rounded-[2rem] text-left w-full space-y-2 hover:bg-slate-900/50 transition-all overflow-hidden group"
            >
              <div className="relative aspect-square overflow-hidden">
                <img 
                  src={p.imageUrl} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  alt={p.name} 
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute top-3 right-3">
                  <div className="bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-white/10">
                    <ShieldCheck size={14} className="text-emerald-500" />
                  </div>
                </div>
              </div>
              <div className="p-4 pt-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin size={10} className="text-slate-500" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                    {districts[idx % districts.length]} District
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white truncate">{p.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-black text-emerald-500">{p.price?.toLocaleString()} <span className="text-[10px] font-normal opacity-60">ETB</span></p>
                  <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-2 py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-700">
                <Search size={32} />
              </div>
              <p className="text-slate-500 font-medium">No products found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );

  const renderProductDetail = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="space-y-8"
    >
      <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl">
        <img src={selectedProduct?.imageUrl} className="w-full h-full object-cover" alt={selectedProduct?.name} referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
        <div className="absolute bottom-8 left-8 right-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">In Stock</span>
            <span className="bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-white/10">Verified Seller</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">{selectedProduct?.name}</h2>
        </div>
      </div>
      
      <div className="px-2 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] mb-1">Price</p>
            <p className="text-4xl font-black text-emerald-500">{selectedProduct?.price?.toLocaleString()} <span className="text-lg font-normal opacity-40">ETB</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] mb-1">Location</p>
            <p className="text-lg font-bold text-white">Bole, Addis Ababa</p>
          </div>
        </div>

        <div className="h-px bg-white/5"></div>

        <div className="space-y-4">
          <h4 className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">Description</h4>
          <p className="text-slate-400 leading-relaxed text-lg">{selectedProduct?.description}</p>
        </div>

        {/* Escrow Visualizer */}
        <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck className="text-emerald-500" size={32} />
              </div>
              <div>
                <h4 className="text-xl font-black tracking-tight text-white">Citylink Escrow</h4>
                <p className="text-emerald-500/60 text-xs font-mono uppercase tracking-widest">Secure Transaction Protocol</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="h-1.5 bg-emerald-500 rounded-full"></div>
              <div className="h-1.5 bg-slate-800 rounded-full"></div>
              <div className="h-1.5 bg-slate-800 rounded-full"></div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              Your payment is held in our <span className="text-white font-bold">Secure Vault</span>. Funds are only released to the seller once you confirm receipt of the item.
            </p>
          </div>
        </div>

        <button 
          onClick={handleBuy}
          disabled={actionLoading}
          className="w-full bg-emerald-500 text-slate-950 font-black text-lg py-6 rounded-[2rem] flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-tighter"
        >
          {actionLoading ? <div className="w-6 h-6 border-3 border-slate-950 border-t-transparent rounded-full animate-spin"></div> : <ShoppingCart size={24} />}
          {actionLoading ? 'Securing Funds...' : 'Purchase with Escrow'}
        </button>
      </div>
    </motion.div>
  );

  const renderOrdersList = () => (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black tracking-tighter uppercase">My Orders</h2>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{orders.length} Total</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto text-slate-700">
            <Package size={40} />
          </div>
          <p className="text-slate-500 font-medium">No orders found in your history.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, idx) => (
            <motion.button 
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleOrderSelect(order)}
              className="w-full bg-slate-900/40 border border-white/5 p-5 rounded-[2rem] flex items-center gap-5 hover:bg-slate-900/60 transition-all text-left group"
            >
              <div className="relative">
                <img src={order.product.imageUrl} className="w-20 h-20 rounded-2xl object-cover" alt={order.product.name} referrerPolicy="no-referrer" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center text-[10px] font-black border-4 border-slate-950">
                  {order.quantity}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    order.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
                    order.status === 'DISPUTED' ? 'bg-red-500/10 text-red-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {order.status}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    #{order.id.slice(0, 8)}
                  </span>
                </div>
                <h4 className="font-bold text-white text-base truncate mb-1">{order.product.name}</h4>
                <p className="text-sm font-black text-emerald-500">{order.totalAmount.toLocaleString()} <span className="text-[10px] font-normal opacity-60">ETB</span></p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <ChevronRight className="text-slate-500" size={20} />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );

  const renderOrderDetail = () => {
    if (!selectedOrder) return null;
    
    const isDelivered = selectedOrder.status === 'DELIVERED';
    const isCompleted = selectedOrder.status === 'COMPLETED';
    const isDisputed = selectedOrder.status === 'DISPUTED';
    const isShipped = selectedOrder.status === 'SHIPPED';

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="space-y-8"
      >
        {/* Order Status Header */}
        <div className="bg-slate-900/50 border border-white/5 p-10 rounded-[3rem] text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-slate-950 border border-white/5 shadow-2xl">
            {isCompleted ? <CheckCircle2 className="text-emerald-500" size={48} /> :
             isDisputed ? <AlertTriangle className="text-red-500" size={48} /> :
             isDelivered ? <Package className="text-blue-500" size={48} /> :
             isShipped ? <Truck className="text-yellow-500" size={48} /> :
             <Clock className="text-slate-400" size={48} />}
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tighter uppercase">{selectedOrder.status}</h3>
            <p className="text-xs font-mono text-slate-500 mt-2 uppercase tracking-widest">Reference: {selectedOrder.id}</p>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="bg-slate-900/30 border border-white/5 p-8 rounded-[2.5rem] space-y-8">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Logistics Timeline</h4>
          
          <div className="relative pl-10 space-y-10">
            <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-800"></div>
            
            <TimelineItem 
              active={true} 
              completed={true} 
              title="Order Secured" 
              desc="Funds held in Escrow Vault" 
            />
            <TimelineItem 
              active={isShipped || isDelivered || isCompleted} 
              completed={isShipped || isDelivered || isCompleted} 
              title="Dispatched" 
              desc="Merchant has shipped the item" 
              meta={selectedOrder.trackingNumber}
            />
            <TimelineItem 
              active={isDelivered || isCompleted} 
              completed={isDelivered || isCompleted} 
              title="Arrived" 
              desc="Item reached destination" 
            />
          </div>
        </div>

        {/* Product Summary */}
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] flex gap-6 items-center">
          <img src={selectedOrder.product.imageUrl} className="w-24 h-24 rounded-2xl object-cover" alt={selectedOrder.product.name} referrerPolicy="no-referrer" />
          <div className="flex-1">
            <h4 className="font-bold text-lg leading-tight">{selectedOrder.product.name}</h4>
            <div className="flex items-center justify-between mt-3">
              <p className="text-sm text-slate-500">Quantity: <span className="text-white font-bold">{selectedOrder.quantity}</span></p>
              <p className="text-xl font-black text-emerald-500">{selectedOrder.totalAmount.toLocaleString()} <span className="text-xs font-normal opacity-60">ETB</span></p>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        {(isShipped || isDelivered) && !isCompleted && !isDisputed && (
          <div className="space-y-6">
            {!showDisputeInput ? (
              <>
                <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-[2.5rem] space-y-6 text-center">
                  <div>
                    <p className="text-[10px] text-blue-400 uppercase font-black tracking-[0.3em] mb-4">Verification Protocol</p>
                    <div className="flex justify-center gap-3">
                      {(selectedOrder.confirmationCode || '------').split('').map((char, i) => (
                        <div key={i} className="w-10 h-14 bg-slate-950 border border-white/10 rounded-xl flex items-center justify-center text-2xl font-black font-mono text-white shadow-inner">
                          {char}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
                      Share this unique code with the merchant only when you have the item in hand.
                    </p>
                  </div>
                  
                  <div className="h-px bg-white/5"></div>

                  <div className="space-y-4">
                    <p className="text-sm text-blue-400 font-bold uppercase tracking-widest">Release Escrow Funds</p>
                    <input
                      type="text"
                      value={confirmationCode}
                      onChange={(e) => setConfirmationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-5 text-center text-2xl tracking-[0.3em] font-black font-mono focus:outline-none focus:border-emerald-500 transition-all shadow-2xl"
                      maxLength={6}
                    />
                  </div>
                </div>
                
                <button 
                  onClick={handleConfirmDelivery}
                  disabled={actionLoading || confirmationCode.length < 4}
                  className="w-full bg-emerald-500 text-slate-950 font-black text-lg py-6 rounded-[2rem] flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-tighter"
                >
                  {actionLoading ? 'Verifying...' : <><CheckCircle2 size={24} /> Confirm & Release Funds</>}
                </button>
                
                <button 
                  onClick={() => setShowDisputeInput(true)}
                  disabled={actionLoading}
                  className="w-full bg-transparent text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 border border-red-500/20 hover:bg-red-500/5 transition-colors"
                >
                  <AlertTriangle size={20} /> Raise a Dispute
                </button>
              </>
            ) : (
              <div className="space-y-6 bg-slate-900 border border-red-500/20 p-8 rounded-[2.5rem]">
                <div className="flex items-center gap-3 text-red-500">
                  <AlertTriangle size={24} />
                  <h4 className="text-xl font-black tracking-tight uppercase">File Dispute</h4>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Please provide a detailed reason for the dispute. Our arbitration team will review the case within 24 hours.
                </p>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl p-5 text-sm min-h-[150px] focus:outline-none focus:border-red-500 transition-all"
                />
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowDisputeInput(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDispute}
                    disabled={actionLoading || !disputeReason}
                    className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black hover:bg-red-600 transition-all disabled:opacity-50 shadow-xl shadow-red-500/20"
                  >
                    Submit Case
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isCompleted && (
          <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[2.5rem] text-center space-y-2">
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-lg text-emerald-500 font-black uppercase tracking-tighter">Transaction Finalized</p>
            <p className="text-sm text-slate-400 leading-relaxed">Funds have been successfully released to the merchant. Thank you for using Addis Marketplace.</p>
          </div>
        )}

        {isDisputed && (
          <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[2.5rem] text-center space-y-2">
            <AlertTriangle size={40} className="text-red-500 mx-auto mb-2" />
            <p className="text-lg text-red-500 font-black uppercase tracking-tighter">Under Arbitration</p>
            <p className="text-sm text-slate-400 leading-relaxed">A dispute has been filed. Funds are frozen in the Escrow Vault until an admin resolution is reached.</p>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-32">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 p-6 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => {
              if (view === 'PRODUCT') setLocalView('LIST');
              else if (view === 'ORDER_DETAIL') setLocalView('ORDERS');
              else setView('home');
            }}
            className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-all active:scale-90"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-2xl font-black tracking-tighter uppercase">
            {view === 'LIST' || view === 'PRODUCT' ? 'Marketplace' : 'My Orders'}
          </h1>
        </div>
        
        {(view === 'LIST' || view === 'PRODUCT') && (
          <button 
            onClick={() => setLocalView('ORDERS')}
            className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-all relative active:scale-90"
          >
            <Package size={22} />
            {orders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-slate-950"></span>
            )}
          </button>
        )}
      </header>

      <div className="p-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'LIST' && <motion.div key="list">{renderProductList()}</motion.div>}
          {view === 'PRODUCT' && <motion.div key="product">{renderProductDetail()}</motion.div>}
          {view === 'ORDERS' && <motion.div key="orders">{renderOrdersList()}</motion.div>}
          {view === 'ORDER_DETAIL' && <motion.div key="order_detail">{renderOrderDetail()}</motion.div>}
        </AnimatePresence>
      </div>
    </div>
  );
};

const TimelineItem = ({ active, completed, title, desc, meta }: any) => (
  <div className="relative">
    <div className={`absolute -left-[35px] w-8 h-8 rounded-xl flex items-center justify-center border-4 border-slate-950 transition-all duration-500 ${
      completed ? 'bg-emerald-500 scale-110' : active ? 'bg-blue-500 animate-pulse' : 'bg-slate-800'
    }`}>
      {completed ? <CheckCircle2 size={14} className="text-slate-950" /> : <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>}
    </div>
    <div className="space-y-1">
      <p className={`font-black text-sm uppercase tracking-tight ${active ? 'text-white' : 'text-slate-600'}`}>{title}</p>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
      {meta && (
        <div className="mt-3 p-3 bg-slate-950 border border-white/5 rounded-xl inline-block">
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Tracking ID</p>
          <p className="text-xs font-mono text-white tracking-widest">{meta}</p>
        </div>
      )}
    </div>
  </div>
);

export default Marketplace;
