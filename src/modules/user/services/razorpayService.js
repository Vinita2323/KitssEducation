// Razorpay Integration Service for KITSS Education Coaching & Course Subscriptions
// Handles dynamic script loading, checkout initialization, and test transaction processing.

export const RAZORPAY_CONFIG = {
  keyId: "rzp_test_TRZdg2aAOYv4KK",
  keySecret: "Zu7lopLZWWZtA4T0R5Z2ORhU",
  merchantName: "KITSS Education",
  themeColor: "#FF8A00",
  logo: "/KitssLogo.png",
};

/**
 * Dynamically loads the official Razorpay Checkout SDK if not already present
 * @returns {Promise<boolean>} True if script loaded successfully
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById("razorpay-checkout-script");
    if (existingScript) {
      existingScript.onload = () => resolve(true);
      existingScript.onerror = () => resolve(false);
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay Checkout SDK");
      resolve(false);
    };

    document.body.appendChild(script);
  });
};

/**
 * Opens Razorpay Checkout Modal
 * @param {Object} params
 * @param {number} params.amountInRupees - Amount in INR (will be converted to paise)
 * @param {Object} params.course - Course details (id, title)
 * @param {Object} [params.plan] - Selected plan details (name, duration)
 * @param {Object} [params.student] - Student contact info (name, email, phone)
 * @param {Function} params.onSuccess - Callback on successful payment (receives response with razorpay_payment_id)
 * @param {Function} [params.onFailure] - Callback on payment failure
 * @param {Function} [params.onDismiss] - Callback when modal is closed without payment
 */
export const openRazorpayCheckout = async ({
  amountInRupees,
  course,
  plan,
  student,
  onSuccess,
  onFailure,
  onDismiss,
}) => {
  const isLoaded = await loadRazorpayScript();

  if (!isLoaded || !window.Razorpay) {
    if (onFailure) {
      onFailure(new Error("Razorpay Checkout SDK could not be loaded. Please check your network."));
    }
    return null;
  }

  const amountInPaise = Math.round(amountInRupees * 100);

  const options = {
    key: RAZORPAY_CONFIG.keyId,
    amount: amountInPaise,
    currency: "INR",
    name: RAZORPAY_CONFIG.merchantName,
    description: `${course?.title || "Coaching Course"}${plan?.name ? ` - ${plan.name}` : ""}`,
    image: RAZORPAY_CONFIG.logo,
    prefill: {
      name: student?.name || "Student",
      email: student?.email || "student@example.com",
      contact: student?.phone || "9876543210",
    },
    notes: {
      courseId: course?.id || "",
      courseTitle: course?.title || "",
      planName: plan?.name || "Standard Pass",
      environment: "test_mode",
    },
    theme: {
      color: RAZORPAY_CONFIG.themeColor,
      backdrop_color: "rgba(10, 29, 63, 0.75)",
    },
    modal: {
      ondismiss: function () {
        if (onDismiss) onDismiss();
      },
      escape: true,
      backdropclose: false,
    },
    handler: function (response) {
      // response contains:
      // - razorpay_payment_id (e.g. 'pay_29QQoUBi66xm2f')
      // - razorpay_order_id (if order created on server)
      // - razorpay_signature (if verified)
      if (onSuccess) {
        onSuccess(response);
      }
    },
  };

  try {
    const rzpInstance = new window.Razorpay(options);
    rzpInstance.on("payment.failed", function (failResponse) {
      if (onFailure) {
        onFailure(failResponse.error || new Error("Payment transaction failed."));
      }
    });
    rzpInstance.open();
    return rzpInstance;
  } catch (err) {
    console.error("Razorpay initiation error:", err);
    if (onFailure) onFailure(err);
    return null;
  }
};
