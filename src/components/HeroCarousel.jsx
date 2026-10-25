
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function HeroCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/products");

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  function nextSlide() {
    setActiveSlide((current) => (current + 1) % products.length);
  }

  function previousSlide() {
    setActiveSlide(
      (current) => (current - 1 + products.length) % products.length
    );
  }


  if (products.length === 0) {
    return (
      <section className="hero-carousel">
        <p>Loading snacks...</p>
      </section>
    );
  }

  const currentProduct = products[activeSlide];

  return (
    <section className="hero-carousel">
      <button
        className="hero-arrow hero-arrow-left"
        onClick={previousSlide}
        aria-label="Previous product"
      >
        <ChevronLeft size={24} />
      </button>

      <img
        key={currentProduct._id}
        src={currentProduct.image}
        alt={currentProduct.name}
        className="hero-product-image"
      />

      <button
        className="hero-arrow hero-arrow-right"
        onClick={nextSlide}
        aria-label="Next product"
      >
        <ChevronRight size={24} />
      </button>

      <button
        className="view-product-btn"
        onClick={() => {
            navigate(`/product/${currentProduct._id}`)}}
      >
        View Product
      </button>

      <div className="hero-dots">
        {products.map((product, index) => (
          <button
            key={product._id}
            className={`hero-dot ${
              activeSlide === index ? "active" : ""
            }`}
            onClick={() => setActiveSlide(index)}
            aria-label={`Show ${product.name}`}
            aria-current={activeSlide === index ? "true" : undefined}
          />
        ))}
      </div>
    </section>
  );
}

export default HeroCarousel;
