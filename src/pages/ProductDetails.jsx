
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  MessageCircle,
  Plus,
  Minus,
  ArrowLeft,
  X,
  MapPin,
  Phone,
  UserRound,
  ShoppingBag,
} from "lucide-react";

function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    landmark: "",
  });

  const subtotal = product
    ? Number(product.price) * quantity
    : 0;

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProduct() {
      setLoading(true);
      setError("");
      setProduct(null);
      setQuantity(1);

      try {
        const response = await fetch(
          `http://localhost:5000/api/products/${id}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "This product could not be found."
              : "Unable to load this product. Please try again."
          );
        }

        const data = await response.json();
        setProduct(data);
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("Error fetching product:", err);
        setError(err.message || "Something went wrong.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProduct();

    return () => controller.abort();
  }, [id]);

  function increaseQuantity() {
    if (!product) return;

    setQuantity((current) =>
      Math.min(current + 1, Number(product.stock))
    );
  }

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function handleCustomerChange(event) {
    const { name, value } = event.target;

    setCustomer((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function submitWhatsAppOrder(event) {
    event.preventDefault();

    if (submitting) return;

    if (!product || Number(product.stock) < quantity) {
      setError("Sorry, the requested quantity is unavailable.");
      setShowOrderForm(false);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // 1. Save the order in MongoDB through Express.
      const response = await fetch(
        "http://localhost:5000/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerName: customer.name.trim(),
            phoneNumber: customer.phone.trim(),
            address: customer.address.trim(),
            landmark: customer.landmark.trim(),
            items: [
              {
                productId: product._id,
                quantity,
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save your order."
        );
      }

      const savedOrder = data.order;

      if (!savedOrder?._id) {
        throw new Error(
          "The server did not return a valid order ID."
        );
      }

      // 2. Prepare the WhatsApp message from the saved order.
      // Replace with your SnackStop number, including country code
      // without a plus sign or spaces.
      const whatsappNumber = "917675818445";

      const message = [
        "Hi SnackStop! I'd like to place an order.",
        "",
        `Order ID: ${savedOrder._id}`,
        `Product: ${product.name}`,
        `Quantity: ${quantity}`,
        `Subtotal: ₹${Number(savedOrder.subtotal).toFixed(2)}`,
        `Delivery fee: ₹${Number(savedOrder.deliveryFee).toFixed(2)}`,
        `Total: ₹${Number(savedOrder.totalPrice).toFixed(2)}`,
        "",
        "CUSTOMER DETAILS",
        `Name: ${customer.name.trim()}`,
        `Phone: ${customer.phone.trim()}`,
        `Address: ${customer.address.trim()}`,
        `Landmark: ${customer.landmark.trim() || "Not provided"}`,
        "",
        "Please confirm product availability and delivery details.",
      ].join("\n");

      const whatsappURL =
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

      // 3. Open WhatsApp after the order has been saved.
      // Browsers may block this because it follows an async request.
      const whatsappWindow = window.open(
        whatsappURL,
        "_blank",
        "noopener,noreferrer"
      );

      setShowOrderForm(false);

      if (!whatsappWindow) {
        alert(
          `Order saved successfully! Order ID: ${savedOrder._id}. ` +
          "Your browser may have blocked WhatsApp. Please allow pop-ups and try again."
        );
      } else {
        alert(
          `Order saved successfully! Your order ID is ${savedOrder._id}.`
        );
      }
    } catch (err) {
      console.error("Order submission failed:", err);
      setError(
        err.message || "Unable to place your order. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#FFF8EF] px-4 text-[#321C16]">
        <p>Loading product...</p>
      </main>
    );
  }

  if (error && !product) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#FFF8EF] px-4 text-center text-[#321C16]">
        <h1 className="font-serif text-2xl">
          Product unavailable
        </h1>
        <p>{error}</p>
        <Link
          to="/"
          className="rounded-full bg-[#C62828] px-6 py-3 text-white hover:bg-[#321C16]"
        >
          <ArrowLeft className="mr-2 inline" size={18} />
          Back to Home
        </Link>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#FFF8EF] px-4 text-[#321C16]">
        <p>Product unavailable.</p>
      </main>
    );
  }

  const outOfStock = Number(product.stock) < 1;

  return (
    <main className="min-h-screen bg-[#FFF8EF] px-4 py-8 text-[#321C16] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[#6B5144] hover:text-[#C62828]"
        >
          <ArrowLeft size={18} />
          Continue shopping
        </Link>

        <div className="grid items-start gap-8 md:grid-cols-2 md:gap-12">
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl bg-[#F4B66F] p-6 sm:min-h-[460px] sm:p-10">
            <img
              src={product.image}
              alt={product.name}
              className="max-h-[420px] w-full object-contain"
            />
          </div>

          <div className="py-2 sm:py-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#C62828]">
              {product.category}
            </p>

            <h1 className="mb-4 font-serif text-3xl sm:text-4xl lg:text-5xl">
              {product.name}
            </h1>

            <p className="mb-5 text-2xl font-semibold text-[#C62828]">
              ₹{Number(product.price).toFixed(2)}
            </p>

            <p className="mb-6 leading-7 text-[#6B5144]">
              {product.description ||
                "Discover this imported snack at SnackStop."}
            </p>

            <p
              className={`mb-6 text-sm font-medium ${
                outOfStock ? "text-[#C62828]" : "text-[#163B23]"
              }`}
            >
              {outOfStock
                ? "Currently out of stock"
                : `${product.stock} available`}
            </p>

            <div className="mb-6">
              <p className="mb-3 text-sm font-medium">
                Quantity
              </p>

              <div className="inline-flex items-center gap-5 rounded-full border border-[#E8DCCB] px-3 py-2">
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1 || submitting}
                  aria-label="Decrease quantity"
                  className="rounded-full p-1 hover:bg-[#F4E8D8] disabled:opacity-40"
                >
                  <Minus size={18} />
                </button>

                <span className="min-w-5 text-center font-medium">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={increaseQuantity}
                  disabled={
                    outOfStock ||
                    quantity >= Number(product.stock) ||
                    submitting
                  }
                  aria-label="Increase quantity"
                  className="rounded-full p-1 hover:bg-[#F4E8D8] disabled:opacity-40"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="mb-6 flex items-center justify-between border-y border-[#E8DCCB] py-4">
              <span className="text-sm text-[#6B5144]">
                Subtotal ({quantity}{" "}
                {quantity === 1 ? "item" : "items"})
              </span>

              <span className="text-lg font-semibold">
                ₹{subtotal.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                setShowOrderForm(true);
              }}
              disabled={outOfStock || submitting}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-[#C62828] px-6 py-4 font-medium text-[#FFF8EF] transition-colors hover:bg-[#321C16] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingBag size={20} />
              Buy on WhatsApp
              <MessageCircle size={20} />
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-[#6B5144]">
              We'll save your order request first, then you can
              contact us on WhatsApp to confirm availability and
              delivery charges.
            </p>
          </div>
        </div>
      </div>

      {/* Customer delivery form */}
      {showOrderForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(event) => {
            if (
              event.target === event.currentTarget &&
              !submitting
            ) {
              setShowOrderForm(false);
            }
          }}
        >
          <form
            onSubmit={submitWhatsAppOrder}
            className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-[#FFF8EF] p-5 text-[#321C16] shadow-xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl">
                  Delivery Details
                </h2>
                <p className="mt-2 text-sm text-[#6B5144]">
                  Enter your details to save your order and continue
                  to WhatsApp.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowOrderForm(false)}
                disabled={submitting}
                aria-label="Close delivery form"
                className="rounded-full p-2 hover:bg-[#F4E8D8] disabled:opacity-40"
              >
                <X size={20} />
              </button>
            </div>

            <div className="rounded-xl bg-[#F4E8D8] p-4">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {product.name}
                  </p>
                  <p className="text-sm text-[#6B5144]">
                    Quantity: {quantity}
                  </p>
                </div>
                <p className="font-semibold">
                  ₹{subtotal.toFixed(2)}
                </p>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium">
                <UserRound size={16} />
                Full name *
              </span>
              <input
                name="name"
                value={customer.name}
                onChange={handleCustomerChange}
                placeholder="Enter your full name"
                autoComplete="name"
                required
                maxLength={100}
                disabled={submitting}
                className="w-full rounded-xl border border-[#E8DCCB] bg-white p-3 outline-none focus:border-[#C62828] disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Phone size={16} />
                Phone number *
              </span>
              <input
                name="phone"
                type="tel"
                value={customer.phone}
                onChange={handleCustomerChange}
                placeholder="Your contact number"
                autoComplete="tel"
                inputMode="tel"
                pattern="[0-9+() -]{8,20}"
                required
                maxLength={20}
                disabled={submitting}
                className="w-full rounded-xl border border-[#E8DCCB] bg-white p-3 outline-none focus:border-[#C62828] disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium">
                <MapPin size={16} />
                Full delivery address *
              </span>
              <textarea
                name="address"
                value={customer.address}
                onChange={handleCustomerChange}
                placeholder="House number, street, area, town and PIN code"
                autoComplete="street-address"
                required
                maxLength={500}
                rows={3}
                disabled={submitting}
                className="w-full resize-y rounded-xl border border-[#E8DCCB] bg-white p-3 outline-none focus:border-[#C62828] disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Nearby landmark (optional)
              </span>
              <input
                name="landmark"
                value={customer.landmark}
                onChange={handleCustomerChange}
                placeholder="School, shop or nearby landmark"
                maxLength={150}
                disabled={submitting}
                className="w-full rounded-xl border border-[#E8DCCB] bg-white p-3 outline-none focus:border-[#C62828] disabled:opacity-60"
              />
            </label>

            <div className="rounded-xl border border-[#E8DCCB] p-3 text-sm">
              <div className="flex justify-between gap-3">
                <span>Product subtotal</span>
                <span className="font-semibold">
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>
              <p className="mt-2 leading-5 text-[#6B5144]">
                Delivery charges and the final amount will be
                confirmed with you before payment.
              </p>
            </div>

            {error && (
              <p role="alert" className="text-sm text-[#C62828]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || outOfStock}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#C62828] px-5 py-3 font-medium text-white transition hover:bg-[#321C16] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MessageCircle size={20} />
              {submitting
                ? "Saving your order..."
                : "Save Order & Continue to WhatsApp"}
            </button>

            <p className="text-center text-xs leading-5 text-[#6B5144]">
              Your order request is not confirmed until SnackStop
              replies. Payment is not collected at this step.
            </p>
          </form>
        </div>
      )}
    </main>
  );
}

export default ProductDetails;
