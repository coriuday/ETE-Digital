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

    def _simulation_allowed(self) -> bool:
        return settings.ENVIRONMENT != "production"

    def create_payment_intent(
        self,
        amount_minor_units: int,
        currency: str = "inr",
        metadata: Optional[dict] = None,
        capture_method: str = "manual",
    ) -> Tuple[Optional[str], Optional[str]]:
        if not self._is_available():
            if not self._simulation_allowed():
                return (None, None)
            return (
                "simulated_secret",
                "simulated_pi_" + (metadata or {}).get("tryout_id", "test"),
            )

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
        if not self._is_available():
            if not self._simulation_allowed():
                return False
            print(f"[SIMULATION] Capturing payment: {payment_intent_id}")
            return True

        try:
            import stripe

            stripe.PaymentIntent.capture(payment_intent_id)
            return True
        except Exception as e:
            print(f"Stripe capture failed: {e}")
            return False

    def refund_payment(self, payment_intent_id: str, reason: str = "requested_by_customer") -> bool:
        if not self._is_available():
            if not self._simulation_allowed():
                return False
            print(f"[SIMULATION] Refunding payment: {payment_intent_id}")
            return True

        try:
            import stripe

            stripe.Refund.create(payment_intent=payment_intent_id, reason=reason)
            return True
        except Exception as e:
            print(f"Stripe refund failed: {e}")
            return False

    def create_checkout_session(
        self,
        amount_minor_units: int,
        currency: str,
        success_url: str,
        cancel_url: str,
        metadata: Optional[dict] = None,
    ) -> Optional[str]:
        if not self._is_available():
            if not self._simulation_allowed():
                return None
            return f"{success_url}?session_id=simulated"

        try:
            import stripe

            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": currency,
                            "unit_amount": amount_minor_units,
                            "product_data": {
                                "name": "Job Tryout Payment",
                                "description": "Payment for completing a job tryout task",
                            },
                        },
                        "quantity": 1,
                    }
                ],
                mode="payment",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata=metadata or {},
                payment_intent_data={
                    "capture_method": "manual",
                    "metadata": metadata or {},
                },
            )
            return session.url
        except Exception as e:
            print(f"Stripe checkout session creation failed: {e}")
            return None

    def verify_webhook(self, payload: bytes, sig_header: str) -> Optional[dict]:
        if not self._is_available() or not settings.STRIPE_WEBHOOK_SECRET:
            return None

        try:
            import stripe

            event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
            return event
        except Exception as e:
            print(f"Stripe webhook verification failed: {e}")
            return None


payment_service = PaymentService()
