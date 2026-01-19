import os
import django
from unittest.mock import MagicMock
from decimal import Decimal
import datetime
import sys

# Setup Django (needed for settings access inside utils)
# Add current directory to path
sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "boutique_backend.settings")
django.setup()

try:
    from customer.utils import generate_order_pdf
except ImportError:
    # If standard import fails, try absolute path style if needed, but above setup should work
    print("Error importing generate_order_pdf")
    sys.exit(1)

def run_test():
    # Mock Order
    order = MagicMock()
    order.order_number = "ORD-TEST-001"
    order.created_at = datetime.datetime.now()
    order.status = "paid"
    
    # Mock method
    order.get_payment_method_display = MagicMock(return_value="Online Payment")
    
    # Mock Shipping Info
    order.shipping_address = "123 Test St\nApartment 4B"
    order.shipping_city = "Metropolis"
    order.shipping_state = "NY"
    order.shipping_pincode = "10001"
    
    # Mock Financials
    order.subtotal_amount = Decimal("100.00")
    order.shipping_amount = Decimal("10.00")
    order.tax_amount = Decimal("5.00")
    order.discount_amount = Decimal("0.00")
    order.total_amount = Decimal("115.00")
    
    # Mock Items
    item1 = MagicMock()
    # Explicitly set product mock
    product1 = MagicMock()
    product1.name = "Elegant Silk Saree with Embroidery"
    item1.product = product1
    
    item1.size = "L"
    item1.quantity = 2
    item1.price = Decimal("30.00")
    item1.discount_price = None
    item1.total = Decimal("60.00")
    
    item2 = MagicMock()
    product2 = MagicMock()
    product2.name = "Cotton Kurti"
    item2.product = product2
    
    item2.size = "M"
    item2.quantity = 1
    item2.price = Decimal("40.00")
    item2.discount_price = None
    item2.total = Decimal("40.00")
    
    # items.all() returns the list
    order.items.all.return_value = [item1, item2]

    # Generate PDF
    print("Generating PDF...")
    try:
        pdf_bytes = generate_order_pdf(order)
        print(f"PDF generated. Size: {len(pdf_bytes)} bytes")
        
        # Save to file
        output_path = "test_invoice.pdf"
        with open(output_path, "wb") as f:
            f.write(pdf_bytes)
        print(f"Saved to {os.path.abspath(output_path)}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_test()
