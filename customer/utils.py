import os
from fpdf import FPDF
from django.conf import settings
from decimal import Decimal

class InvoicePDF(FPDF):
    def __init__(self, order):
        super().__init__()
        self.order = order
        self.set_auto_page_break(auto=True, margin=15)
        self.add_page()

    def header(self):
        # Logo
        # Try to find the logo in static files
        logo_path = os.path.join(settings.BASE_DIR, 'customer/static/customer/images/email_logo.png')
        if not os.path.exists(logo_path):
             logo_path = os.path.join(settings.BASE_DIR, 'static/images/logo.png')
        
        if os.path.exists(logo_path):
            try:
                # x=10, y=8, w=33 (adjust as needed)
                self.image(logo_path, 10, 12, 33)

            except Exception:
                pass # If image fails, just skip it

        # Font for Company Name
        self.set_font('Arial', 'B', 15)
        # Move to the right
        self.cell(80) 
        # Title
        self.cell(30, 10, 'INVOICE', 0, 0, 'C')
        # Line break
        self.ln(28)

    def footer(self):
        # Position at 1.5 cm from bottom
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        # Page number
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

    def invoice_body(self):
        order = self.order
        
        # -----------------------------
        # 1. INFO SECTION (Order ID, Date, Status)
        # -----------------------------
        self.set_font('Arial', '', 10)
        
        # Helper to get safe string
        def safe_str(val):
            return str(val) if val else ''

        # Extract Customer Info
        # Try to get from CheckoutDetails first (best source for guest/billing info)
        # Note: We need to import CheckoutDetails potentially, or rely on order fields
        # Ideally order model should have billing info snapshot. 
        # Based on existing views.py, we have shipping info on Order, and maybe 'notes' has customer name.
        
        # We will use the Order fields as primary source of truth for the generated PDF
        order_date_str = order.created_at.strftime('%d %b %Y, %I:%M %p')
        
        self.set_fill_color(240, 240, 240)
        self.set_font('Arial', 'B', 10)
        self.cell(0, 8, f"Order Details: #{order.order_number}", 0, 1, 'L', 1)
        self.set_font('Arial', '', 10)
        
        # Left Block: Order Info
        start_y = self.get_y()
        self.cell(95, 6, f"Date: {order_date_str}", 0, 1)
        self.cell(95, 6, f"Status: {order.status.title()}", 0, 1)
        self.cell(95, 6, f"Payment Method: {order.get_payment_method_display()}", 0, 1)
        
        # Right Block: Customer/Shipping Info
        # Reset Y to start_y and move X
        curr_y = self.get_y()
        self.set_y(start_y)
        self.set_x(105) # Middle of page roughly
        
        self.cell(90, 6, f"Ship To:", 0, 1)
        self.set_x(105)
        
        # Construct address lines
        shipping_parts = [
            order.shipping_address,
            f"{order.shipping_city}, {order.shipping_state}",
            order.shipping_pincode
        ]
        # Filter empty lines
        address_block = "\n".join([p for p in shipping_parts if p])
        
        self.multi_cell(90, 5, address_block, 0, 'L')
        
        self.ln(10) # Spacer

        # -----------------------------
        # 2. ITEMS TABLE
        # -----------------------------
        # Header
        self.set_fill_color(50, 50, 50)
        self.set_text_color(255, 255, 255)
        self.set_font('Arial', 'B', 9)
        
        # Column Widths: [Product(100), Size(20), Qty(20), Price(25), Total(25)] = 190 total
        cw = [90, 25, 20, 25, 30]
        
        self.cell(cw[0], 8, 'Product', 1, 0, 'C', 1)
        self.cell(cw[1], 8, 'Size', 1, 0, 'C', 1)
        self.cell(cw[2], 8, 'Qty', 1, 0, 'C', 1)
        self.cell(cw[3], 8, 'Price', 1, 0, 'C', 1)
        self.cell(cw[4], 8, 'Total', 1, 1, 'C', 1)

        # Rows
        self.set_text_color(0, 0, 0)
        self.set_font('Arial', '', 9)
        
        fill = False
        self.set_fill_color(245, 245, 245) # Alternating row color

        items = order.items.all()
        for item in items:
            product_name = item.product.name[:50] + ('...' if len(item.product.name) > 50 else '')
            size_txt = item.size if item.size else '-'
            
            # Helper for currency
            # Using effective price (which accounts for line-item discount if we stored it that way)
            # If your model stores 'total' on OrderItem, use that.
            # Assuming item.total is accurate per views.py logic
            
            # Format numbers
            price_val = item.price # Original price typically
            if item.discount_price:
               price_val = item.discount_price # Use discount price if applied
            
            price_str = f"{price_val:.2f}"
            total_str = f"{item.total:.2f}"
            
            self.cell(cw[0], 7, product_name, 1, 0, 'L', fill)
            self.cell(cw[1], 7, size_txt, 1, 0, 'C', fill)
            self.cell(cw[2], 7, str(item.quantity), 1, 0, 'C', fill)
            self.cell(cw[3], 7, price_str, 1, 0, 'R', fill)
            self.cell(cw[4], 7, total_str, 1, 1, 'R', fill)
            
            fill = not fill # toggle

        self.ln(5)

        # -----------------------------
        # 3. SUMMARY TOTALS
        # -----------------------------
        # Move to right side
        self.set_font('Arial', '', 10)
        
        def add_summary_row(label, value, bold=False):
            self.set_x(120) # Start from right side column
            if bold:
                self.set_font('Arial', 'B', 10)
            else:
                self.set_font('Arial', '', 10)
                
            self.cell(40, 7, label, 0, 0, 'R')
            amount_text = f"$ {value:,.2f}" if value >= 0 else f"- $ {abs(value):,.2f}"
            self.cell(30, 7, amount_text, 1, 1, 'R')
        add_summary_row("Subtotal:", order.subtotal_amount)
        add_summary_row("Shipping:", order.shipping_amount)
        add_summary_row("GST (5%):", order.tax_amount)
        
        if order.discount_amount and order.discount_amount > 0:
            self.set_text_color(200, 0, 0) # Red for discount
            add_summary_row("Discount:", -order.discount_amount)
            self.set_text_color(0, 0, 0) # Reset

        # Grand Total
        add_summary_row("Grand Total:", order.total_amount, bold=True)
        
        # -----------------------------
        # 4. FOOTER NOTE
        # -----------------------------
        self.ln(10)
        self.set_font('Arial', 'I', 9)
        self.cell(0, 6, "Thank you for shopping with He She Style Wear.", 0, 1, 'C')
        self.cell(0, 6, "For any queries, contact support@hesheboutique.com", 0, 1, 'C')


def generate_order_pdf(order):
    """
    Generates a PDF for the given order using FPDF.
    Returns the PDF content as bytes.
    """
    pdf = InvoicePDF(order)
    pdf.invoice_body()
    
    # Return bytes
    # FPDF output(dest='S') returns a string (latin-1 encoded) in standard python, 
    # but we need bytes for Django email attachment.
    # We use output(dest='S').encode('latin-1')
    
    return pdf.output(dest='S').encode('latin-1')
