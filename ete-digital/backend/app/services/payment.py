"""
Payment service using Stripe for tryout payment processing
"""
from typing import Optional, Tuple
from app.core.config import settings

try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False


class PaymentService:
    """Stripe payment service for tryout payments"""

    def __init__(self):
        if STRIPE_AVAILABLE and settings.STRIPE_SECRET_KEY:
            stripe.api_key = settings.STRIPE_SECRET_KEY

    def _is_available(self) -> bool:
        return STRIPE_AVAILABLE and bool(settings.STRIPE_SECRET_KEY)

    def create_payment_intent(
        self,
        amount_minor_units: int,  # Amount in smallest currency unit (paise/INR, cents/USD, etc.)
        currency: str = "inr",
        metadata: Optional[dict] = None,
        capture_method: str = "manual",  # 'manual' = escrow; 'automatic' = immediate capture
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Create a Stripe PaymentIntent.
        
        Args:
            amount_minor_units: Amount in the smallest denomination of the given currency
                                (paise for INR, cents for USD, etc.)
            currency: ISO currency code (e.g. 'inr', 'usd')
            metadata: Optional metadata dict (e.g., tryout_id, candidate_id)
            capture_method: 'manual' for escrow, 'automatic' for immediate
        
        Returns:
            Tuple of (client_secret, payment_intent_id) or (None, None) on error
        """
        if not self._is_available():
            print("Stripe not configured. Payments are in simulation mode.")
            return ("simulated_secret", "simulated_pi_" + (metadata or {}).get("tryout_id", "test"))

        try:
            import stripe
            intent = stripe.PaymentIntent.create(
                amount=amount_minor_units,
                currency=currency,
                capture_method=capture_method,
                metadata=metadata or {},
            )
            return (intent.client_secret, intent.id)
        except Exception as e:
            print(f"Stripe PaymentIntent creation failed: {e}")
            return (None, None)

    def capture_payment(self, payment_intent_id: str) -> bool:
        """
        Capture (release from escrow) a PaymentIntent.
        Used when employer approves tryout and releases payment to candidate.
        
        Returns:
            True if captured successfully
        """
        if not self._is_available():
            print(f"[SIMULATION] Capturing payment: {payment_intent_id}")
            return True

        try:
            import stripe
            stripe.PaymentIntent.capture(payment_intent_id)
            return True
        except Exception as e:
            print(f"Stripe capture failed: {e}")
            return False

    def refund_payment(
        self,
        payment_intent_id: str,
        reason: str = "requested_by_customer"
    ) -> bool:
        """
        Refund a PaymentIntent back to employer.
        Used when tryout is rejected or expired.
        
        Returns:
            True if refunded successfully
        """
        if not self._is_available():
            print(f"[SIMULATION] Refunding payment: {payment_intent_id}")
            return True

        try:
            import stripe
            stripe.Refund.create(
                payment_intent=payment_intent_id,
                reason=reason
            )
            return True
        except Exception as e:
            print(f"Stripe refund failed: {e}")
            return False

    def create_checkout_session(
        self,
        amount_minor_units: int,  # Amount in smallest currency unit (paise/INR, cents/USD, etc.)
        currency: str,
        success_url: str,
        cancel_url: str,
        metadata: Optional[dict] = None,
    ) -> Optional[str]:
        """
        Create a Stripe Checkout session URL for hosted payment page.
        
        Returns:
            Checkout session URL or None
        """
        if not self._is_available():
            return f"{success_url}?session_id=simulated"

        try:
            import stripe
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": currency,
                        "unit_amount": amount_minor_units,
                        "product_data": {
                            "name": "Job Tryout Payment",
                            "description": "Payment for completing a job tryout task",
                        },
                    },
                    "quantity": 1,
                }],
                mode="payment",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata=metadata or {},
                payment_intent_data={
                    "capture_method": "manual",
                    "metadata": metadata or {},
                }
            )
            return session.url
        except Exception as e:
            print(f"Stripe checkout session creation failed: {e}")
            return None

    def verify_webhook(self, payload: bytes, sig_header: str) -> Optional[dict]:
        """
        Verify and parse a Stripe webhook event.
        
        Args:
            payload: Raw request body bytes
            sig_header: Stripe-Signature header value
        
        Returns:
            Event dict or None if invalid
        """
        if not self._is_available() or not settings.STRIPE_WEBHOOK_SECRET:
            return None

        try:
            import stripe
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
            return event
        except Exception as e:
            print(f"Stripe webhook verification failed: {e}")
            return None


# Singleton instance
payment_service = PaymentService()
