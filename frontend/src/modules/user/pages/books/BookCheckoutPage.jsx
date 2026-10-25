import { commerceService } from '../../services/commerceService';
import { openRazorpayCheckout } from '../../services/razorpayService';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building,
  CheckCircle2,
  Lock,
  ArrowRight,
  BookOpen
} from "lucide-react";
import { bookService } from "../../services/bookService";
import { orderService } from "../../services/orderService";
import { useLibrary } from "../../context/LibraryContext";
import { useToast } from "../../context/ToastContext";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { Modal } from "../../components/common/Modal";
import { SkeletonLoader, ErrorState } from "../../components/common/EmptyState";

export const BookCheckoutPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const actingIdentity = useRef(user?.id); actingIdentity.current = user?.id;
  const [params,setParams] = useSearchParams();
  const [availability,setAvailability] = useState(null), [order,setOrder] = useState(null), [paymentMessage,setPaymentMessage] = useState('');
  const creationKey = useRef(crypto.randomUUID()), attemptKey = useRef(crypto.randomUUID());
  useEffect(() => { const c = new AbortController(); setOrder(null); commerceService.config(c.signal).then(setAvailability).catch(e=>{if(e.code!=='ABORTED')setPaymentMessage(e.message);}); return ()=>c.abort(); }, [user?.id]);
  const orderId = params.get('order');
  useEffect(() => { if (!orderId) return; const c = new AbortController(); let count=0; const refresh=()=>commerceService.status(orderId,c.signal).then(row=>{setOrder(row); if(row.orderStatus==='captured'&&row.activationStatus==='applied'){setCompletedOrder({...row,amount:row.amountMinor/100});setShowSuccessModal(true);}}).catch(e=>{if(e.code!=='ABORTED')setPaymentMessage(e.message);});refresh();const timer=setInterval(()=>{if(++count<=40)refresh();},3000);return()=>{c.abort();clearInterval(timer);};},[orderId,user?.id]);
  const { markBookPurchased, isBookOwned } = useLibrary();
  const { showSuccess, showError } = useToast();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const data = await bookService.getBookById(id);
        setBook(data);
      } catch (err) {
        console.error("Book fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const handlePayNow = async () => {
    if (!book || !availability?.available) { setPaymentMessage('Payments unavailable until rotated Test Mode credentials and operator validation are ready.'); return; }
    const checkoutIdentity = user?.id;
    setProcessing(true);
    try {
      const current = order || await commerceService.create({kind:'book',id:book.id},creationKey.current);
      if (actingIdentity.current !== checkoutIdentity) return;
      setOrder(current);const next=new URLSearchParams(params);next.set('order',current.id);setParams(next,{replace:true});
      await openRazorpayCheckout({orderId:current.id,attemptKey:current.attemptId || attemptKey.current,onSuccess:state=>{if(actingIdentity.current !== checkoutIdentity)return;setOrder(state);setPaymentMessage(state.orderStatus==='captured'?'Capture verified; checking fulfillment.':state.paymentStatus==='failed'?'Payment attempt failed. No access granted; check order status before retry.':'Payment pending capture.');},onDismiss:()=>{if(actingIdentity.current === checkoutIdentity)setPaymentMessage('Checkout dismissed. Payment status remains pending until provider verification.');},onFailure:e=>{if(actingIdentity.current === checkoutIdentity)setPaymentMessage(e.message);}});
    } catch(e){setPaymentMessage(e.message);} finally{setProcessing(false);}
  };

  if (loading) {
    return <SkeletonLoader type="card" count={2} />;
  }

  if (!book) {
    return (
      <ErrorState
        title="Book Not Found"
        message="Could not find the book for checkout."
        onRetry={() => navigate("/books")}
      />
    );
  }

  const displayPrice = order ? order.amountMinor / 100 : book.price;
  const isFree = Number(displayPrice) === 0;
  const alreadyOwned = isBookOwned(book.id);

  if (alreadyOwned) {
    return (
      <div className="max-w-md mx-auto py-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#17B26A] mx-auto shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-extrabold text-[#0A1D3F]">
          {isFree ? "This Book is Free!" : "You Already Own This Book!"}
        </h2>
        <p className="text-xs text-[#667085]">
          You have full access to read "{book.title}" in your library.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link to={`/books/${book.id}/read`}>
            <PrimaryButton variant="green" size="md" icon={BookOpen}>
              Open in PDF Reader
            </PrimaryButton>
          </Link>
          <Link to="/books">
            <button className="px-4 py-2 border border-[#E6E8EC] rounded-xl text-xs font-semibold text-[#0A1D3F] hover:bg-gray-50">
              Browse More
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const discountVal = order ? 0 : (book.originalPrice || book.price) - book.price;

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Top Back Link */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0A1D3F] hover:text-[#FF8A00] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Details</span>
        </button>
        <span className="text-xs font-semibold text-[#667085]">Secure Checkout</span>
      </div>

      {/* Checkout Card */}
      <div className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-7 shadow-xs space-y-5">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0A1D3F] tracking-tight">
            Order Summary
          </h2>
          <p className="text-xs text-[#667085] mt-0.5">
            Review your digital book purchase
          </p>
        </div>

        {/* Selected Product Card */}
        <div className="p-4 bg-[#F7F8FA] rounded-2xl border border-[#E6E8EC] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0A1D3F] text-white">
              {book.board}
            </span>
            <h4 className="text-sm font-bold text-[#0A1D3F] truncate mt-1">
              {book.title}
            </h4>
            <p className="text-xs text-[#667085] truncate">
              {book.subtitle} • {book.pages} Pages
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-sm font-bold text-[#0A1D3F]">
              ₹{displayPrice}
            </span>
            {!order && book.originalPrice && (
              <span className="text-xs text-[#667085] line-through block">
                ₹{book.originalPrice}
              </span>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider block">
            Select Payment Method
          </label>

          <div className="space-y-2">
            {[
              { id: "upi", name: "UPI (Google Pay, PhonePe, Paytm)", icon: Smartphone, desc: "Choose a payment method in Razorpay Checkout" },
              { id: "card", name: "Debit / Credit Card", icon: CreditCard, desc: "Visa, MasterCard, RuPay" },
              { id: "netbanking", name: "Net Banking", icon: Building, desc: "Availability is determined by Razorpay" },
            ].map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;

              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition cursor-pointer ${
                    isSelected
                      ? "bg-orange-50/50 border-[#FF8A00] ring-1 ring-[#FF8A00]"
                      : "bg-white border-[#E6E8EC] hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isSelected ? "bg-[#FF8A00] text-white" : "bg-[#F7F8FA] text-[#0A1D3F]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#0A1D3F] block">
                        {method.name}
                      </span>
                      <span className="text-[11px] text-[#667085]">{method.desc}</span>
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? "border-[#FF8A00] bg-[#FF8A00]" : "border-gray-300"
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bill Summary */}
        <div className="p-4 bg-[#F7F8FA] rounded-2xl border border-[#E6E8EC] space-y-2 text-xs">
          <div className="flex justify-between text-[#667085]">
            <span>Original Price:</span>
            <span>₹{order ? displayPrice : book.originalPrice || displayPrice}</span>
          </div>
          {discountVal > 0 && (
            <div className="flex justify-between text-[#17B26A] font-semibold">
              <span>Special Discount:</span>
              <span>-₹{discountVal}</span>
            </div>
          )}
          <div className="flex justify-between text-[#667085]">
            <span>Tax and fee policy:</span>
            <span className="text-[#17B26A] font-semibold">Pending confirmation</span>
          </div>
          <div className="border-t border-[#E6E8EC] pt-2 flex justify-between text-sm font-bold text-[#0A1D3F]">
            <span>Final Payable Amount:</span>
            <span className="text-[#FF8A00]">₹{displayPrice}</span>
          </div>
        </div>

        {/* Security Assurance */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#667085]">
          <ShieldCheck className="w-4 h-4 text-[#17B26A]" />
          <span>Razorpay Standard Checkout - Test Mode only</span>
        </div>

        {paymentMessage && <p role="status" className="text-xs text-amber-800">{paymentMessage}</p>}
        {!availability?.available && <p role="status" className="p-3 rounded-xl bg-amber-50 text-xs">Payments unavailable: fresh rotated Test Mode credentials and operator validation are pending.</p>}
        {isFree && <p role="status" className="text-xs">Zero-price access policy is pending. No automatic entitlement is granted.</p>}
        {order && <p role="status" className="text-xs break-words">{order.simulated ? 'SIMULATED TEST - ' : 'Test Mode - '}Order {order.reference}: {order.orderStatus}; payment: {order.paymentStatus}; fulfillment: {order.activationStatus}</p>}
        {/* CTA */}
        <div>
          <PrimaryButton
            variant="orange"
            size="lg"
            fullWidth
            onClick={handlePayNow}
            loading={processing}
            disabled={!availability?.available || isFree || order?.creationStatus === 'unknown'}
          >
            Pay ₹{displayPrice} & Access Book
          </PrimaryButton>
        </div>
      </div>

      {/* Payment Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate("/orders");
        }}
        title="Test payment captured and fulfilled"
        showClose={false}
      >
        <div className="text-center py-2 space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#ECFDF3] border border-[#17B26A]/30 flex items-center justify-center text-[#17B26A] mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="text-base font-extrabold text-[#0A1D3F]">
            Thank You for Your Order!
          </h3>
          <p className="text-xs text-[#667085]">
            Backend verification confirmed capture and an entitlement. The full reading experience follows in a later stage.
          </p>

          {completedOrder && (
            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC] text-left text-xs space-y-1">
              <div className="flex justify-between text-[#667085]">
                <span>Order ID:</span>
                <span className="font-mono font-bold text-[#0A1D3F]">
                  {completedOrder.id}
                </span>
              </div>
              <div className="flex justify-between text-[#667085]">
                <span>Amount Paid:</span>
                <span className="font-bold text-[#17B26A]">
                  ₹{completedOrder.amount}
                </span>
              </div>
            </div>
          )}

          <div className="pt-3 space-y-2">
            <PrimaryButton
              variant="navy"
              size="md"
              fullWidth
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/orders");
              }}
              icon={ArrowRight}
            >
              Start Reading Now
            </PrimaryButton>

            <Link
              to="/books"
              className="inline-block text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
            >
              Browse More Books
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
};
