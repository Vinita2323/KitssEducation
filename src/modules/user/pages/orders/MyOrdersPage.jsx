import React, { useState, useEffect } from "react";
import { ShoppingBag, FileText, Download, CheckCircle2, AlertCircle, Clock, ExternalLink } from "lucide-react";
import { orderService } from "../../services/orderService";
import { useToast } from "../../context/ToastContext";
import { StatusBadge } from "../../components/common/SectionHeader";
import { Modal } from "../../components/common/Modal";
import { PrimaryButton, SecondaryButton } from "../../components/common/PrimaryButton";
import { SkeletonLoader, EmptyState } from "../../components/common/EmptyState";

export const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { showSuccess } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await orderService.getOrders();
        setOrders(data);
      } catch (err) {
        console.error("Orders load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleDownloadInvoice = (order) => {
    showSuccess(`Downloading tax invoice for ${order.id}...`);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] tracking-tight">
          My Orders
        </h1>
        <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
          View your purchase history, payment receipts, and digital invoices
        </p>
      </div>

      {/* Orders List */}
      {loading ? (
        <SkeletonLoader type="card" count={3} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Orders Yet"
          description="You haven't purchased any books or coaching passes yet."
        />
      ) : (
        <div className="space-y-3.5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-[#E6E8EC] p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6E8EC] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#0A1D3F]">
                    {order.id}
                  </span>
                  <span className="text-xs text-[#667085]">• {order.date}</span>
                </div>

                <StatusBadge status={order.status} size="sm" />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-50 text-[#0A1D3F]">
                    {order.category}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-[#0A1D3F] mt-1">
                    {order.productName}
                  </h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Payment: <span className="font-semibold text-[#0A1D3F]">{order.paymentMethod}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 sm:self-center">
                  <span className="text-base sm:text-lg font-bold text-[#0A1D3F]">
                    ₹{order.amount}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="px-3.5 py-1.5 bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-bold rounded-xl transition active:scale-95 shadow-xs"
                  >
                    View Receipt
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details & Receipt Modal */}
      <Modal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title="Payment Receipt & Tax Invoice"
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs text-[#0A1D3F]">
            {/* Header info */}
            <div className="p-3.5 bg-[#F7F8FA] rounded-2xl border border-[#E6E8EC] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#667085]">Order Reference:</span>
                <span className="font-mono font-bold">{selectedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Date & Time:</span>
                <span>{selectedOrder.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Payment Method:</span>
                <span>{selectedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Transaction ID:</span>
                <span className="font-mono">{selectedOrder.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Status:</span>
                <StatusBadge status={selectedOrder.status} />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h4 className="font-bold mb-2 uppercase text-[11px] text-[#667085]">
                Purchased Item(s)
              </h4>
              <div className="border border-[#E6E8EC] rounded-xl overflow-hidden divide-y divide-[#E6E8EC]">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center bg-white">
                    <span className="font-bold">{item.name}</span>
                    <span className="font-mono font-bold">₹{item.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC] space-y-1">
              <div className="flex justify-between text-[#667085]">
                <span>Total Amount:</span>
                <span>₹{selectedOrder.originalAmount || selectedOrder.amount}</span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-[#17B26A]">
                  <span>Discount Applied:</span>
                  <span>-₹{selectedOrder.discountAmount}</span>
                </div>
              )}
              <div className="border-t border-[#E6E8EC] pt-1.5 flex justify-between font-bold text-sm text-[#0A1D3F]">
                <span>Paid Total:</span>
                <span className="text-[#FF8A00]">₹{selectedOrder.amount}</span>
              </div>
            </div>

            {/* Action */}
            <div className="pt-2">
              <PrimaryButton
                variant="orange"
                size="md"
                fullWidth
                onClick={() => handleDownloadInvoice(selectedOrder)}
                icon={Download}
              >
                Download PDF Invoice
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
