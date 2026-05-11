from fastapi import APIRouter

router = APIRouter()

@router.get("/graph")
def get_graph():

    nodes = [
        {
            "id": "cart",
            "label": "Cart",
            "info": [
                    "Add/remove items",
                    "Update quantity",
                    "Calculate totals"
                ]
        },
        {
            "id": "payment",
            "label": "Payment",
            "info": [
                    "Razorpay integration",
                    "Stripe integration",
                    "Secure checkout flow"
                ]
        },
        {
            "id": "order",
            "label": "Order",
            "info": [
                    "Place order",
                    "Track order status",
                    "View order history"
                ]
        }
    ]

    edges = [
        {
            "source": "cart",
            "target": "payment"
        },
        {
            "source": "payment",
            "target": "order"
        }
    ]

    return {
        "nodes": nodes,
        "edges": edges
    }