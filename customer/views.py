from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from adminpanel.models import RunningBanner, Banner, TraditionalLook   # adjust path if needed
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from datetime import datetime, timedelta
import json
import re
from .models import Product, Customer, Order, OrderItem, Cart, Coupon, CheckoutDetails, PaymentEvent, Review, SubCategory
from decimal import Decimal
from customer.models import Product, Customer, Order, OrderItem, Cart, Coupon, CheckoutDetails, PaymentEvent
from customer.utils import generate_order_pdf
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from email.mime.image import MIMEImage
import os
from django.db import transaction
from django.db.models import Sum, Count, F, Q
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from email.mime.image import MIMEImage
from django.contrib.staticfiles import finders
from django.conf import settings
import random
import os


@require_http_methods(["GET"])
def get_product_detail(request, slug):
    try:
        product = Product.objects.get(slug=slug)
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)

    data = {
        "id": product.slug,
        "slug": product.slug,
        "name": product.name,
        "image": request.build_absolute_uri(product.image.url) if product.image else request.build_absolute_uri('/static/customer/images/placeholder.jpg'),
        "thumbnail1": request.build_absolute_uri(product.thumbnail1.url) if getattr(product, 'thumbnail1') and product.thumbnail1 else None,
        "thumbnail2": request.build_absolute_uri(product.thumbnail2.url) if getattr(product, 'thumbnail2') and product.thumbnail2 else None,
        "thumbnail3": request.build_absolute_uri(product.thumbnail3.url) if getattr(product, 'thumbnail3') and product.thumbnail3 else None,
        "description": product.description or '',
        "price": str(float(product.price)) if product.price is not None else '0',
        "discount_price": str(float(product.discount_price)) if product.discount_price else None,
        "category": product.category or '',
        "style_fit": product.style_fit or '',
        "shipping_return": product.shipping_return or '',
        "gender": product.gender or '',
        "size_chart_type": getattr(product, 'size_chart_type', 'none'),
    }

    # Handle Free Size vs Standard Sizes
    if product.sizes and 'Free Size' in product.sizes:
        data["size_data"] = {
            "Free Size": {
                "price": float(product.price_s) if product.price_s is not None else None,
                "stock": product.stock_s if product.stock_s is not None else 0,
                "discount": product.discount_s or 0,
                "discounted_price": float(product.discounted_price_s) if product.discounted_price_s is not None else None,
                "is_sale": getattr(product, 'is_sale_s', False),
                "sale_label": getattr(product, 'sale_label_s', '')
            }
        }
    else:
        data["size_data"] = {
            "S": {
                "price": float(product.price_s) if product.price_s is not None else None,
                "stock": product.stock_s if product.stock_s is not None else 0,
                "discount": product.discount_s or 0,
                "discounted_price": float(product.discounted_price_s) if product.discounted_price_s is not None else None,
                "is_sale": getattr(product, 'is_sale_s', False),
                "sale_label": getattr(product, 'sale_label_s', '')
            },
            "M": {
                "price": float(product.price_m) if product.price_m is not None else None,
                "stock": product.stock_m if product.stock_m is not None else 0,
                "discount": product.discount_m or 0,
                "discounted_price": float(product.discounted_price_m) if product.discounted_price_m is not None else None,
                "is_sale": getattr(product, 'is_sale_m', False),
                "sale_label": getattr(product, 'sale_label_m', '')
            },
            "L": {
                "price": float(product.price_l) if product.price_l is not None else None,
                "stock": product.stock_l if product.stock_l is not None else 0,
                "discount": product.discount_l or 0,
                "discounted_price": float(product.discounted_price_l) if product.discounted_price_l is not None else None,
                "is_sale": getattr(product, 'is_sale_l', False),
                "sale_label": getattr(product, 'sale_label_l', '')
            },
            "XL": {
                "price": float(product.price_xl) if product.price_xl is not None else None,
                "stock": product.stock_xl if product.stock_xl is not None else 0,
                "discount": product.discount_xl or 0,
                "discounted_price": float(product.discounted_price_xl) if product.discounted_price_xl is not None else None,
                "is_sale": getattr(product, 'is_sale_xl', False),
                "sale_label": getattr(product, 'sale_label_xl', '')
            },
            "XXL": {
                "price": float(product.price_xxl) if product.price_xxl is not None else None,
                "stock": product.stock_xxl if product.stock_xxl is not None else 0,
                "discount": product.discount_xxl or 0,
                "discounted_price": float(product.discounted_price_xxl) if product.discounted_price_xxl is not None else None,
                "is_sale": getattr(product, 'is_sale_xxl', False),
                "sale_label": getattr(product, 'sale_label_xxl', '')
            },
        }

    data["rating_data"] = product.get_rating_data()

    return JsonResponse(data)




# In your Product API view
@require_http_methods(["GET"])
def get_size_data(request, product_id):
    product = get_object_or_404(Product, id=product_id)

    size_data = {
        'S': {'price': product.price_s, 'stock': product.stock_s, 'discount': product.discount_s or 0, 'discounted_price': product.discounted_price_s},
        'M': {'price': product.price_m, 'stock': product.stock_m, 'discount': product.discount_m or 0, 'discounted_price': product.discounted_price_m},
        'L': {'price': product.price_l, 'stock': product.stock_l, 'discount': product.discount_l or 0, 'discounted_price': product.discounted_price_l},
        'XL': {'price': product.price_xl, 'stock': product.stock_xl, 'discount': product.discount_xl or 0, 'discounted_price': product.discounted_price_xl},
        'XXL': {'price': product.price_xxl, 'stock': product.stock_xxl, 'discount': product.discount_xxl or 0, 'discounted_price': product.discounted_price_xxl},
    }

    return JsonResponse(size_data)



def kids_subcategories(request):
    subcats = (
        Product.objects
        .filter(gender__iexact="kids")
        .values_list("sub_category", flat=True)
        .distinct()
    )

    return JsonResponse({"subcategories": list(subcats)})
def header_partial(request):
    """View to serve header.html as a partial for AJAX loading"""
    return render(request, "customer/header.html")

def index(request):
    """Homepage view - displays featured and all active products"""
    # Show featured products (women or kids)
    # If no featured products, show regular products instead
    featured_products = Product.objects.filter(
        is_active=True,) 
    """Home page view"""
    # Fetch active banners for home page
    banners = Banner.objects.filter(page='home', is_active=True).order_by('order')

    # Get featured products
    featured_products = Product.objects.filter(is_featured=True, is_active=True)[:8]
    
    # Show all products (women or kids) for the collections section
    all_products = Product.objects.filter(
        is_active=True,
        gender__in=['women', 'kids']
    )[:12]
    
    # Fetch only active Traditional Look items, ordered by 'order' with optimizing product fetch
    traditional_looks = TraditionalLook.objects.filter(is_active=True).select_related('product').order_by('order')

    return render(request, "customer/index.html", {
        'banners': banners, # Added banners to context
        'featured_products': featured_products,
        'all_products': all_products,
        'traditional_looks': traditional_looks,
    })

def product(request, product_id):
    """Individual product detail page"""
    try:
        product_obj = Product.objects.get(slug=product_id, is_active=True)
    except Product.DoesNotExist:
        try:
            product_obj = Product.objects.get(id=product_id, is_active=True)
        except (Product.DoesNotExist, ValueError):
            return render(request, "customer/product_not_found.html", {"product_id": product_id})
    # Provide `customer_product` in context so template can render DB-driven accordion items
    return render(request, "customer/product.html", {"product": product_obj, "customer_product": product_obj})



# --- replace your existing get_products_api with this ---
from django.db.models import Q, Count

# Replace your existing get_products_api with this version

def get_products_api(request):
    """
    Returns active products as JSON.
    Filtering rules:
      - If subcategory(s) provided -> filter by Product.sub_category (case-insensitive match)
      - Also apply gender filter if provided (works with subcategory filter)
      - Otherwise, if gender provided -> filter by gender only
      - Ordering by order_by param allowed.
    """
    # read params
    # Accept repeated params or comma-separated single param
    raw_subcats = request.GET.getlist('subcategory') or request.GET.getlist('sub_category') or []
    if not raw_subcats:
        single = request.GET.get('subcategory') or request.GET.get('sub_category')
        if single:
            raw_subcats = [s.strip() for s in single.split(',') if s.strip()]
    
    # NEW: Support for subcategory_id parameter (resolve IDs to names)
    raw_subcat_ids = request.GET.getlist('subcategory_id')
    if raw_subcat_ids:
        try:
            print(f"DEBUG API: Processing subcategory_ids: {raw_subcat_ids}")
            # Resolve IDs to names
            resolved_names = list(SubCategory.objects.filter(id__in=raw_subcat_ids).values_list('name', flat=True))
            print(f"DEBUG API: Resolved names: {resolved_names}")
            if resolved_names:
                raw_subcats.extend(resolved_names)
        except Exception as e:
            print(f"Error resolving subcategory IDs in API: {e}")


    gender = request.GET.get('gender')
    order_by = request.GET.get('order_by', '-created_at')
    limit = request.GET.get('limit')

    # base queryset
    products_qs = Product.objects.filter(is_active=True)

    # Apply gender filter if provided (works with or without subcategory filter)
    if gender:
        products_qs = products_qs.filter(gender__iexact=gender)
    
    # FABRIC filter: accept repeated params or comma-separated list
    raw_fabrics = request.GET.getlist('fabric') or []
    if not raw_fabrics:
        single_fab = request.GET.get('fabric')
        if single_fab:
            raw_fabrics = [f.strip() for f in single_fab.split(',') if f.strip()]
    if raw_fabrics:
        fq = Q()
        for f in raw_fabrics:
            token = f.strip()
            if not token:
                continue
            # Use icontains to match 'cotton' and 'cotton blend', etc.
            fq |= Q(fabric__icontains=token)
        products_qs = products_qs.filter(fq)

    # strict sub_category filtering (case-insensitive exact match)
    if raw_subcats:
        # Debug: log incoming params when multiple subcategories selected
        try:
            if len(raw_subcats) > 1:
                print("DEBUG get_products_api - request.GET:", dict(request.GET))
                print("DEBUG get_products_api - raw_subcats:", raw_subcats, "gender:", gender)
        except Exception:
            # keep silent on logging errors
            pass
        q = Q()
        for sc in raw_subcats:
            sc = sc.strip()
            if not sc:
                continue
            
            # Normalize to check aliases (spaces <-> underscores)
            sc_underscore = sc.replace(' ', '_')
            sc_space = sc.replace('_', ' ')
            
            # Match against all variations
            q |= Q(sub_category__iexact=sc)
            q |= Q(sub_category__iexact=sc_underscore)
            q |= Q(sub_category__iexact=sc_space)
            
            # Ensure backward compatibility/redundancy with main category field
            q |= Q(category__iexact=sc)
            q |= Q(category__iexact=sc_underscore)
            q |= Q(category__iexact=sc_space)
        products_qs = products_qs.filter(q)
        
    # ordering
    if order_by == 'price':
        products_qs = products_qs.order_by('price')
    elif order_by == '-price':
        products_qs = products_qs.order_by('-price')
    else:
        products_qs = products_qs.order_by(order_by)

    # limit
    if limit:
        try:
            limit = int(limit)
            products_qs = products_qs[:limit]
        except ValueError:
            pass

    # build response (same shape your frontend expects)
    products_data = []
    for p in products_qs:
        products_data.append({
            'id': p.slug,
            'slug': p.slug,
            'name': p.name,
            'category': p.category,
            'sub_category': p.sub_category or "",
            'tags': p.tags or "",
            'description': p.description or "",
            'fabric': p.fabric or "",
            'colors': p.colors or "",
            'price': str(float(p.price)),
            'discount_price': str(float(p.discount_price)) if p.discount_price else None,
            'final_price': str(float(p.final_price)),
            'stock': p.stock,
            'is_featured': p.is_featured,
            'gender': p.gender or '',
            'image': request.build_absolute_uri(p.image.url) if p.image else request.build_absolute_uri('/static/customer/images/placeholder.jpg'),
            'thumbnail1': request.build_absolute_uri(p.thumbnail1.url) if getattr(p, 'thumbnail1') and p.thumbnail1 else None,
            'thumbnail2': request.build_absolute_uri(p.thumbnail2.url) if getattr(p, 'thumbnail2') and p.thumbnail2 else None,
            'thumbnail3': request.build_absolute_uri(p.thumbnail3.url) if getattr(p, 'thumbnail3') and p.thumbnail3 else None,

        })

    return JsonResponse({'products': products_data})





def get_fabrics(request):
    # Accept optional filters to compute fabric counts in the current filter context
    gender = request.GET.get('gender')

    # subcategory(s) support (repeated or comma-separated)
    raw_subcats = request.GET.getlist('subcategory') or request.GET.getlist('sub_category') or []
    if not raw_subcats:
        single = request.GET.get('subcategory') or request.GET.get('sub_category')
        if single:
            raw_subcats = [s.strip() for s in single.split(',') if s.strip()]

    query = Product.objects.filter(is_active=True)
    if gender:
        query = query.filter(gender__iexact=gender)

    if raw_subcats:
        q = Q()
        for sc in raw_subcats:
            sc = sc.strip()
            if not sc:
                continue
            q |= Q(sub_category__iexact=sc)
        query = query.filter(q)

    # Compute counts grouped by normalized fabric tokens.
    sep_re = re.compile(r'[,&/;]+')
    token_counts = {}
    for p in query.exclude(fabric__isnull=True).exclude(fabric=""):
        raw = (p.fabric or '')
        parts = sep_re.split(raw)
        seen = set()
        for part in parts:
            token = part.strip()
            if not token:
                continue
            key = token.lower()
            if key in seen:
                continue
            seen.add(key)
            token_counts[key] = token_counts.get(key, 0) + 1

    fabrics = []
    for key, cnt in token_counts.items():
        display = key.title()
        fabrics.append({'name': display, 'count': cnt})

    fabrics = sorted(fabrics, key=lambda x: x['name'].lower())
    return JsonResponse({"fabrics": fabrics})


def get_subcategories(request):
    """
    API endpoint to get all available subcategories from SubCategory model.
    Optional filters:
      - gender: filter by gender (e.g., 'women', 'kids')
    Returns a sorted list of active subcategory names.
    """
    gender = request.GET.get('gender')
    
    # Query SubCategory model instead of Product model for consistency with header
    query = SubCategory.objects.filter(is_active=True)
    if gender:
        query = query.filter(gender__iexact=gender)
    
    # Get subcategory names, ordered alphabetically
    subcategories = list(query.order_by('name').values_list('name', flat=True))
    
    return JsonResponse({"subcategories": subcategories})


def get_kids_subcategories(request):
    """
    API endpoint to get all available subcategories for Kids from SubCategory model.
    Returns a sorted list of active subcategory names for gender='kids'.
    """
    # Query SubCategory model instead of Product model for consistency
    query = SubCategory.objects.filter(is_active=True, gender__iexact='kids')
    
    # Get subcategory names, ordered alphabetically
    subcategories = list(query.order_by('name').values_list('name', flat=True))
    
    return JsonResponse({"subcategories": subcategories})


def get_kids_fabrics(request):
    """
    API endpoint to get all available fabrics for Kids products.
    Returns a list of unique fabric values for gender='kids'.
    """
    query = Product.objects.filter(is_active=True, gender__iexact='kids')
    
    # Compute counts grouped by normalized fabric tokens.
    sep_re = re.compile(r'[,&/;]+')
    token_counts = {}
    for p in query.exclude(fabric__isnull=True).exclude(fabric=""):
        raw = (p.fabric or '')
        parts = sep_re.split(raw)
        seen = set()
        for part in parts:
            token = part.strip()
            if not token:
                continue
            key = token.lower()
            if key in seen:
                continue
            seen.add(key)
            token_counts[key] = token_counts.get(key, 0) + 1

    fabrics = []
    for key, cnt in token_counts.items():
        display = key.title()
        fabrics.append({'name': display, 'count': cnt})

    fabrics = sorted(fabrics, key=lambda x: x['name'].lower())
    return JsonResponse({"fabrics": [f['name'].lower() for f in fabrics]})


@require_http_methods(["GET"])
def api_get_coupons(request):
    """Return active/valid coupons matching any of the provided subcategories.

    Query params:
      - subcategories: comma-separated list of sub_category values
    """
    try:
        raw = request.GET.get('subcategories', '')
        subs = [s.strip() for s in raw.split(',') if s.strip()]
        qs = Coupon.objects.filter(is_active=True)
        # filter by validity dates
        today = timezone.now().date()
        qs = qs.filter(Q(start_date__lte=today) | Q(start_date__isnull=True))
        qs = qs.filter(Q(end_date__gte=today) | Q(end_date__isnull=True))
        if subs:
            q = Q()
            for sc in subs:
                q |= Q(sub_category__iexact=sc)
            qs = qs.filter(q)

        coupons = []
        for c in qs:
            coupons.append({
                'code': c.code,
                'discount_value': float(c.discount_value),
                'discount_type': c.discount_type,
                'sub_category': c.sub_category,
                'start_date': c.start_date.isoformat() if c.start_date else None,
                'end_date': c.end_date.isoformat() if c.end_date else None,
            })

        return JsonResponse({'success': True, 'coupons': coupons})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def apply_coupon_api(request):
    """Validate a coupon code against cart items and return discount amount in dollars.

    Expected JSON body: { code: 'ABC', cart_items: [{id: <slug|id>, quantity: n}, ...] }
    """
    try:
        data = json.loads(request.body)
        code = (data.get('code') or '').strip()
        cart_items = data.get('cart_items', [])
        if not code:
            return JsonResponse({'success': False, 'message': 'Coupon code required'}, status=400)
        if not cart_items:
            return JsonResponse({'success': False, 'message': 'Cart items required'}, status=400)

        # find coupon (case-insensitive match)
        try:
            coupon = Coupon.objects.get(code__iexact=code, is_active=True)
        except Coupon.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Coupon not found or inactive'}, status=404)

        # check validity dates
        if hasattr(coupon, 'is_currently_valid') and not coupon.is_currently_valid():
            return JsonResponse({'success': False, 'message': 'Coupon is not valid at this time'}, status=400)

        # Check if user has already used this coupon (One-time use per account)
        if request.user.is_authenticated:
            # Check if any non-cancelled order by this user contains this coupon code in notes
            # We look for "Coupon CODE:" pattern which is how it's stored in create_order
            already_used = Order.objects.filter(
                customer__user=request.user,
                notes__icontains=f"Coupon {coupon.code}:"
            ).exclude(status='cancelled').exists()
            
            if already_used:
                return JsonResponse({
                    'success': False, 
                    'message': 'You have already used this coupon code on a previous order.'
                }, status=400)

        # Build list of product objects and compute subtotal (in dollars) for matched sub_category
        subtotal = Decimal('0.00')
        matched_subtotal = Decimal('0.00')
        for it in cart_items:
            pid = it.get('id')
            qty = int(it.get('quantity', 1) or 1)
            if not pid:
                continue
            # try slug then id
            prod = None
            try:
                prod = Product.objects.get(slug=pid)
            except Exception:
                try:
                    prod = Product.objects.get(id=pid)
                except Exception:
                    prod = None
            if not prod:
                continue
            # assume Product.price is stored in dollars (per requirement)
            price = Decimal(str(prod.discount_price if prod.discount_price else prod.price))
            line_total = price * qty
            subtotal += line_total
            # check sub_category match
            prod_sub = (prod.sub_category or '').strip()
            if coupon.sub_category and prod_sub and prod_sub.lower() == coupon.sub_category.lower():
                matched_subtotal += line_total

        # Determine base for discount: if coupon.sub_category provided then use matched_subtotal else use whole subtotal
        base = matched_subtotal if (coupon.sub_category and coupon.sub_category.strip()) else subtotal
        if base <= 0:
            return JsonResponse({'success': False, 'message': 'No matching items for this coupon'}, status=400)

        # Calculate discount depending on coupon type
        if coupon.discount_type == '%':
            discount_percent = Decimal(str(coupon.discount_value))
            discount_amount = (base * discount_percent) / Decimal('100.00')
        else:
            # fixed amount coupon
            discount_amount = Decimal(str(coupon.discount_value))
            if discount_amount > base:
                discount_amount = base
            discount_percent = None

        # Round to 2 decimals
        discount_amount = discount_amount.quantize(Decimal('0.01'))
        final_total = (subtotal - discount_amount).quantize(Decimal('0.01'))

        return JsonResponse({
            'success': True,
            'coupon_code': coupon.code,
            'discount_type': coupon.discount_type,
            'discount_value': float(coupon.discount_value),
            'discount_percentage': float(discount_percent) if discount_percent is not None else None,
            'sub_category': coupon.sub_category,
            'discount_amount': float(discount_amount),
            'original_total': float(subtotal.quantize(Decimal('0.01'))),
            'final_total': float(final_total),
        })

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


def women(request):
    # Provide initial fabric list from the database so the template can
    # render available fabric filters server-side (works without JS).
    # Split multi-value fabric fields (e.g. "Cotton, Silk") into tokens
    # and deduplicate so the UI shows each fabric only once.
    def _collect_fabric_tokens(qs):
        counts = {}
        sep_re = re.compile(r'[,&/;]+')
        for p in qs.exclude(fabric__isnull=True).exclude(fabric=''):
            raw = (p.fabric or '')
            parts = sep_re.split(raw)
            seen = set()
            for part in parts:
                token = part.strip()
                if not token:
                    continue
                key = token.lower()
                if key in seen:
                    continue
                seen.add(key)
                counts[key] = counts.get(key, 0) + 1
        return counts

    base_qs = Product.objects.filter(is_active=True, gender__iexact='women')
    token_counts = _collect_fabric_tokens(base_qs)
    fabrics = sorted([tok.title() for tok in token_counts.keys()])

    
    initial_products = []
    try:
        qs = base_qs
        # fabrics: repeated params or comma-separated
        raw_fabrics = request.GET.getlist('fabric') or []
        if not raw_fabrics:
            single_fab = request.GET.get('fabric')
            if single_fab:
                raw_fabrics = [f.strip() for f in single_fab.split(',') if f.strip()]

        if raw_fabrics:
            fab_q = Q()
            for f in raw_fabrics:
                t = f.strip()
                if not t:
                    continue
                fab_q |= Q(fabric__icontains=t)
            qs = qs.filter(fab_q)

        # subcategories
        raw_subcats = request.GET.getlist('subcategory') or request.GET.getlist('sub_category') or []
        # Support for subcategory_id
        raw_subcat_ids = request.GET.getlist('subcategory_id')
        if raw_subcat_ids:
             # from .models import SubCategory # Imported at top now
             try:
                 print(f"DEBUG: Processing subcategory_ids: {raw_subcat_ids}")
                 # Resolve IDs to names
                 resolved_names = list(SubCategory.objects.filter(id__in=raw_subcat_ids).values_list('name', flat=True))
                 print(f"DEBUG: Resolved names: {resolved_names}")
                 if resolved_names:
                     raw_subcats.extend(resolved_names)
             except Exception as e:
                 print(f"Error resolving subcategory IDs: {e}")

        if not raw_subcats:
            single = request.GET.get('subcategory') or request.GET.get('sub_category')
            if single:
                raw_subcats = [s.strip() for s in single.split(',') if s.strip()]
        if raw_subcats:
            sc_q = Q()
            for sc in raw_subcats:
                sc = sc.strip()
                if not sc:
                    continue
                sc_q |= Q(sub_category__iexact=sc)
            qs = qs.filter(sc_q)

        # Limit for server-render to avoid huge payload
        qs = qs.order_by('-created_at')[:48]

        for p in qs:
            initial_products.append({
                'id': p.slug,
                'name': p.name,
                'price': float(p.price),
                'discount_price': float(p.discount_price) if p.discount_price else None,
                'image': (request.build_absolute_uri(p.image.url) if p.image else '/static/customer/images/placeholder.jpg'),
                'category': p.sub_category or p.category or '',
                'tags': p.tags or '',
                'description': p.description or '',
                'fabric': p.fabric or '',
                'colors': p.colors or '',
            })
    except Exception:
        initial_products = []

    # Fetch active banners for women page
    banners = Banner.objects.filter(page='women', is_active=True).order_by('order')

    return render(request, "customer/women.html", {
        "fabrics": fabrics, 
        "initial_products": initial_products,
        "selected_subcategories": raw_subcats,
        "banners": banners,
    })

def discount(request):
    """Discount page - displays women's products with discounts, filtered by subcategory"""
    return render(request, "customer/discount.html")

def kids(request):
    def tokenize_fabric(f):
        return [t.strip().lower() for t in re.split(r'[,&/; ]+', f) if t.strip()]

    fabrics = ["cotton", "silk", "georgette", "velvet"]
    base_qs = Product.objects.filter(is_active=True, gender__iexact='kids')
    
    # --- Fabric Tokenization Logic (matches women view) ---
    fabric_tokens = {}
    for f in fabrics:
        fabric_tokens[f] = tokenize_fabric(f)

    initial_products = []
    try:
        qs = base_qs
        # Filter by fabric
        requested_fabrics = request.GET.getlist('fabric')
        if requested_fabrics:
            fabric_q = Q()
            for f_req in requested_fabrics:
                f_req = f_req.lower().strip()
                # find tokens
                if f_req in fabric_tokens:
                    tokens = fabric_tokens[f_req]
                    # build AND query for all tokens in 'fabric' field
                    # e.g. fabric__icontains='silk' AND fabric__icontains='blend'
                    sub_q = Q()
                    for t in tokens:
                        sub_q &= Q(fabric__icontains=t)
                    fabric_q |= sub_q
                else:
                    # fallback
                    fabric_q |= Q(fabric__icontains=f_req)
            qs = qs.filter(fabric_q)

        # Filter by subcategory
        raw_subcats = request.GET.getlist('subcategory') or request.GET.getlist('sub_category') or request.GET.getlist('category') or []
        
        # Support for subcategory_id
        raw_subcat_ids = request.GET.getlist('subcategory_id')
        if raw_subcat_ids:
             # from .models import SubCategory # Imported at top
             try:
                 print(f"DEBUG KIDS: Processing subcategory_ids: {raw_subcat_ids}")
                 # Resolve IDs to names
                 resolved_names = list(SubCategory.objects.filter(id__in=raw_subcat_ids).values_list('name', flat=True))
                 print(f"DEBUG KIDS: Resolved names: {resolved_names}")
                 if resolved_names:
                     raw_subcats.extend(resolved_names)
             except Exception as e:
                 print(f"Error resolving subcategory IDs: {e}")

        if not raw_subcats:
            single = request.GET.get('subcategory') or request.GET.get('sub_category') or request.GET.get('category')
            if single:
                raw_subcats = [s.strip() for s in single.split(',') if s.strip()]
        
        if raw_subcats:
            sc_q = Q()
            for sc in raw_subcats:
                sc = sc.strip()
                if not sc:
                    continue
                # Match against sub_category OR category
                sc_q |= Q(sub_category__iexact=sc) | Q(category__iexact=sc)
            qs = qs.filter(sc_q)

        products = list(qs.order_by('-created_at')[:20]) # Limit initial load for speed
        
        for p in products:
            initial_products.append({
                'id': p.id,
                'name': p.name,
                'price': float(p.price),
                'discount_price': float(p.discount_price) if p.discount_price else None,
                'image': p.image.url if p.image else '',
                'category': p.category or '',
                'sub_category': p.sub_category or '',
                'description': p.description or '',
                'fabric': p.fabric or '',
                'tags': p.tags or '',
                'colors': p.colors or '',
            })
    except Exception:
        initial_products = []

    # Fetch active banners for kids page
    banners = Banner.objects.filter(page='kids', is_active=True).order_by('order')

    return render(request, "customer/kids.html", {
        "fabrics": fabrics, 
        "initial_products": initial_products,
        "selected_subcategories": raw_subcats, # Pass selected subcategories to context
        "banners": banners,
    })

def cart(request):
    return render(request, "customer/cart.html")

def wishlist(request):
    return render(request, "customer/wishlist.html")

def search(request):
    query = request.GET.get('q', '').strip()
    products = []
    
    if query:
        # Normalize query
        q_lower = query.lower()

        # 1. Check for Category Match (Manual Check since no Category model)
        if q_lower == 'women':
            return redirect('women')
        elif q_lower == 'kids':
            return redirect('kids')

        # 2. Check for SubCategory Match
        from .models import SubCategory
        sub_cat = SubCategory.objects.filter(name__iexact=q_lower).first()
        if sub_cat:
            # Redirect to the appropriate gender view with subcategory param
            if sub_cat.gender == 'women':
                return redirect(f"/women/?subcategory={sub_cat.name}")
            elif sub_cat.gender == 'kids':
                return redirect(f"/kids/?subcategory={sub_cat.name}")

        # 3. Default Product Search
        products = Product.objects.filter(
            Q(name__icontains=q_lower) |
            Q(sub_category__icontains=q_lower) |
            Q(category__icontains=q_lower) |
            Q(tags__icontains=q_lower),
            is_active=True
        )
    
    return render(request, "customer/search.html", {"query": query, "products": products})

def profile(request):
    return render(request, "customer/profile.html")

def orders(request):
    return render(request, "customer/orders.html")

def order_detail(request, order_id):
    return render(request, "customer/orders.html", {"order_id": order_id})

def get_orders_api(request):
    """API endpoint to get all orders for the authenticated user"""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'User must be logged in'}, status=401)
    
    try:
        customer = Customer.objects.get(user=request.user)
        orders = Order.objects.filter(customer=customer).order_by('-created_at')
        
        orders_data = []
        for order in orders:
            # Auto-Fulfill Check
            check_and_fulfill_order(order)
            
            items_data = []
            for item in order.items.all():
                # Use discount_price if available, otherwise original price
                effective_price = float(item.discount_price) if item.discount_price else float(item.price)
                items_data.append({
                    'product_id': item.product.slug if item.product.slug else str(item.product.id),
                    'product_name': item.product.name,
                    'product_image': item.product.image.url if item.product.image else '/static/customer/images/placeholder.jpg',
                    'quantity': item.quantity,
                    'price': float(item.price),  # Original price
                    'discount_price': float(item.discount_price) if item.discount_price else None,  # Discount price
                    'effective_price': effective_price,  # Price actually paid
                    'total_price': effective_price * item.quantity  # Total based on effective price
                })
            
            orders_data.append({
                'order_id': order.id,
                'order_number': order.order_number,
                'order_date': order.created_at.isoformat(),
                'status': order.status,
                'shipped_at': order.shipped_at.isoformat() if order.shipped_at else None,
                'delivered_at': order.delivered_at.isoformat() if order.delivered_at else None,
                'total_amount': float(order.total_amount),
                'payment_method': order.payment_method,
                'payment_status': order.payment_status,
                'shipping_address': order.shipping_address,
                'shipping_city': order.shipping_city,
                'shipping_state': order.shipping_state,
                'shipping_pincode': order.shipping_pincode,
                'items': items_data
            })
        
        return JsonResponse({'success': True, 'orders': orders_data})
    except Customer.DoesNotExist:
        return JsonResponse({'success': True, 'orders': []})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

def get_order_detail_api(request, order_id):
    """API endpoint to get a specific order's details"""
    # Allow authenticated users OR guests with matching session order_id
    guest_order_id = request.session.get('guest_order_id')
    is_guest_access = (guest_order_id and str(guest_order_id) == str(order_id))
    
    if not request.user.is_authenticated and not is_guest_access:
        return JsonResponse({'success': False, 'message': 'User must be logged in'}, status=401)
    
    try:
        # Allow Admin/Staff to view any order
        if request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser):
            order = Order.objects.get(id=order_id)
            customer = order.customer
        elif request.user.is_authenticated:
            customer = Customer.objects.get(user=request.user)
            order = Order.objects.get(id=order_id, customer=customer)
        else:
            # Guest Access
            order = Order.objects.get(id=order_id)
            # Security check: ensure this order actually belongs to a guest (user is null)
            # or strictly rely on the session ID match which we already did.
            if order.customer.user is not None:
                 return JsonResponse({'success': False, 'message': 'Unauthorized access to registered order'}, status=403)
            customer = order.customer
        
        check_and_fulfill_order(order)
        
        items_data = []
        for item in order.items.all():
            # Use discount_price if available, otherwise original price
            effective_price = float(item.discount_price) if item.discount_price else float(item.price)
            items_data.append({
                'product_id': item.product.slug if item.product.slug else str(item.product.id),
                'product_name': item.product.name,
                'product_image': item.product.image.url if item.product.image else '/static/customer/images/placeholder.jpg',
                'quantity': item.quantity,
                'price': float(item.price),  # Original price
                'discount_price': float(item.discount_price) if item.discount_price else None,  # Discount price
                'effective_price': effective_price,  # Price actually paid
                'total_price': effective_price * item.quantity,  # Total based on effective price
                'category': item.product.category or '',
                'description': item.product.description or ''
            })
        
        # Get checkout details for billing address if available
        # Assuming billing address might be in order notes or separate model if not on Order
        # For now using shipping as fallback or order fields if they exist
        billing_address = order.shipping_address # Default to shipping if billing not distinct column
        
        # Enrich with customer details
        # For guest, use stored fields on Customer model
        if customer.user:
            cust_user = customer.user
            full_name = f"{cust_user.first_name} {cust_user.last_name}".strip() or cust_user.username
            email = cust_user.email
        else:
            full_name = f"{customer.first_name or ''} {customer.last_name or ''}".strip()
            email = customer.email

        order_data = {
            'order_id': order.id,
            'order_number': order.order_number,
            'order_date': order.created_at.isoformat(),
            'status': order.status,
            'shipped_at': order.shipped_at.isoformat() if order.shipped_at else None,
            'delivered_at': order.delivered_at.isoformat() if order.delivered_at else None,
            'total_amount': float(order.total_amount),
            'subtotal_amount': float(order.subtotal_amount) if order.subtotal_amount else 0.0,
            'tax_amount': float(order.tax_amount) if order.tax_amount else 0.0,
            'shipping_amount': float(order.shipping_amount) if order.shipping_amount else 0.0,
            'discount_amount': float(order.discount_amount) if order.discount_amount else 0.0,
            'payment_method': order.payment_method,
            'payment_status': order.payment_status,
            'shipping_address': order.shipping_address,
            'shipping_city': order.shipping_city,
            'shipping_state': order.shipping_state,
            'shipping_pincode': order.shipping_pincode,
            'billing_address': billing_address, # Added
            'customer_name': full_name, # Added
            'customer_email': email, # Added
            'customer_phone': customer.phone_number if hasattr(customer, 'phone_number') else customer.phone, # Added
            'notes': order.notes or '',
            'items': items_data
        }
        
        return JsonResponse({'success': True, 'order': order_data})
    except Customer.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Customer profile not found'}, status=404)
    except Order.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Order not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

def checkout(request):
    context = {}
    if request.user.is_authenticated:
        try:
            customer = Customer.objects.get(user=request.user)
            context['saved_address'] = {
                'first_name': customer.first_name,
                'last_name': customer.last_name,
                'email': customer.user.email if customer.user.email else customer.email,
                'phone': customer.phone,
                'address': customer.address,
                'city': customer.city,
                'state': customer.state,
                'country': customer.country,
                'pincode': customer.pincode,
            }
        except Customer.DoesNotExist:
            pass
    return render(request, "customer/checkout.html", context)

@csrf_exempt
@require_http_methods(["POST"])
def create_order(request):
    """API endpoint to create an order from checkout"""
    # REMOVED login_required check to allow Guest Checkout
    # if not request.user.is_authenticated:
    #     return JsonResponse({'success': False, 'message': 'User must be logged in'}, status=401)
    
    try:
        # Parse JSON data from request
        data = json.loads(request.body)

        # Get customer profile (Authenticated vs Guest)
        if request.user.is_authenticated:
            customer, created = Customer.objects.get_or_create(user=request.user)
            user_identifier = str(request.user.id)
        else:
            # Guest Logic
            email = data.get('email', '').strip()
            first_name = data.get('first_name', '').strip()
            last_name = data.get('last_name', '').strip()
            
            if not email:
                 return JsonResponse({'success': False, 'message': 'Email is required for guest checkout'}, status=400)
            
            # Check if there is an existing guest customer with this email? 
            # Or should we create a new one? 
            # Strategy: Try to find a guest customer (user=None) with this email. 
            # If exists, update details. If not, create.
            customer = Customer.objects.filter(email=email, user__isnull=True).first()
            if not customer:
                customer = Customer.objects.create(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    user=None # Explicitly Null
                )
            else:
                # Update existing guest details
                if first_name: customer.first_name = first_name
                if last_name: customer.last_name = last_name
                customer.save()
            
            # For order number generation, use a random hash or the guest customer id
            user_identifier = f"G{customer.id}"
        
        # Get cart items
        cart_items = data.get('cart_items', [])
        if not cart_items:
            return JsonResponse({'success': False, 'message': 'Cart is empty'}, status=400)
        
        # Get shipping and billing information
        shipping_address = data.get('shipping_address', '')
        shipping_city = data.get('shipping_city', '')
        shipping_state = data.get('shipping_state', '') or 'N/A'  # Use 'N/A' if not provided
        shipping_pincode = data.get('shipping_pincode', '')[:10]  # Truncate to max 10 characters
        first_name = data.get('first_name', '').strip()

        # Get payment method from checkout (supports cod / cash / online)
        payment_method = data.get('payment_method', 'cod')   # fine
        payment_method = 'cod' if payment_method == 'cash' else 'online'


        
        # Get customer name and contact information
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        
        # Debug logging
        # Debug logging
        print(f"Order creation - User: {request.user}")
        print(f"Order creation - Raw data: first_name='{data.get('first_name', 'NOT PROVIDED')}', last_name='{data.get('last_name', 'NOT PROVIDED')}', email='{data.get('email', 'NOT PROVIDED')}'")
        print(f"Order creation - After strip: first_name='{first_name}', last_name='{last_name}', email='{email}'")
        
        # Update User model with customer information if provided
        # if first_name:
        #     request.user.first_name = first_name
        # if last_name:
        #     request.user.last_name = last_name
        # if email:
        #     request.user.email = email
        # if any([first_name, last_name, email]):
        #     request.user.save()
        #     print(f"Order creation - User after update: first_name='{request.user.first_name}', last_name='{request.user.last_name}'")
        # else:
        #     print("Order creation - WARNING: No name/email provided, skipping User update")
        
        # Update Customer profile with phone and address if provided
        if phone:
            customer.phone = phone
        if shipping_address:
            customer.address = shipping_address
        if shipping_city:
            customer.city = shipping_city
        if shipping_state and shipping_state != 'N/A':
            customer.state = shipping_state
        if shipping_pincode:
            customer.pincode = shipping_pincode
        customer.save()
        
        # Validate required fields (state defaults to 'N/A' if not provided)
        if not shipping_address or not shipping_city or not shipping_pincode:
            return JsonResponse({'success': False, 'message': 'Address, city, and postal code are required'}, status=400)
        
        # Get payment breakdown from checkout (if provided) or calculate
        subtotal_from_checkout = data.get('subtotal')
        tax_from_checkout = data.get('tax')
        shipping_from_checkout = data.get('shipping')
        total_from_checkout = data.get('total')
        
        
        # Calculate total amount and item details
        subtotal = Decimal('0.00')
        order_items_data = []
        total_quantity = 0  # Track total quantity for shipping calculation
        
        for item in cart_items:
            try:
                # Try to get product by slug first, then by id
                product_id_or_slug = item.get('id') or item.get('slug')
                if not product_id_or_slug:
                    return JsonResponse({'success': False, 'message': 'Product ID or slug is missing in cart item'}, status=400)
                
                # Try slug first, then id
                try:
                    product = Product.objects.get(slug=product_id_or_slug, is_active=True)
                except Product.DoesNotExist:
                    try:
                        product = Product.objects.get(id=product_id_or_slug, is_active=True)
                    except (Product.DoesNotExist, ValueError):
                        return JsonResponse({'success': False, 'message': f"Product {product_id_or_slug} not found"}, status=400)
                
                quantity = int(item.get('quantity', 1))
                if quantity <= 0:
                    return JsonResponse({'success': False, 'message': f"Invalid quantity for product {product.name}"}, status=400)
                
                total_quantity += quantity

                # Check stock availability (support size-specific stock fields)
                size_val = item.get('size') or item.get('product_size') or None
                available_stock = None
                if size_val:
                    s = size_val.strip().upper()
                    size_field_map = {
                        'S': 'stock_s', 'M': 'stock_m', 'L': 'stock_l', 'XL': 'stock_xl', 'XXL': 'stock_xxl',
                        'SMALL': 'stock_s', 'MEDIUM': 'stock_m', 'LARGE': 'stock_l', 'EXTRA LARGE': 'stock_xl', '2XL': 'stock_xxl'
                    }
                    field = size_field_map.get(s)
                    if field and hasattr(product, field):
                        try:
                            available_stock = int(getattr(product, field) or 0)
                        except Exception:
                            available_stock = None

                if available_stock is None:
                    # fallback to global product stock
                    try:
                        available_stock = int(product.stock or 0)
                    except Exception:
                        available_stock = 0

                if available_stock < quantity:
                    return JsonResponse({'success': False, 'message': f"Insufficient stock for {product.name} (size: {size_val or 'N/A'}). Available: {available_stock}"}, status=400)
                
                # Determine price: track BOTH original price and discount price separately
                original_price = None
                discount_price = None
                
                # 1. Get original price (size-specific or product-level)
                if item.get('price'):
                    try:
                        original_price = Decimal(str(item.get('price')))
                    except (ValueError, TypeError):
                        pass
                
                if original_price is None and size_val:
                    s = size_val.strip().upper()
                    size_price_map = {
                        'S': 'price_s', 'M': 'price_m', 'L': 'price_l', 'XL': 'price_xl', 'XXL': 'price_xxl',
                        'SMALL': 'price_s', 'MEDIUM': 'price_m', 'LARGE': 'price_l', 'EXTRA LARGE': 'price_xl', '2XL': 'price_xxl'
                    }
                    price_field = size_price_map.get(s)
                    if price_field and hasattr(product, price_field):
                        size_price = getattr(product, price_field)
                        if size_price is not None:
                            original_price = size_price
                
                # Fall back to product's base price
                if original_price is None:
                    original_price = Decimal(str(product.price))
                
                # 2. Get discount price (if exists)
                if item.get('discount_price'):
                    try:
                        d_price = Decimal(str(item.get('discount_price')))
                        if d_price > 0:
                            discount_price = d_price
                    except (ValueError, TypeError):
                        pass
                
                # If no discount price from cart, check product-level discount
                if discount_price is None and size_val:
                    s = size_val.strip().upper()
                    size_discount_map = {
                        'S': 'discounted_price_s', 'M': 'discounted_price_m', 'L': 'discounted_price_l', 
                        'XL': 'discounted_price_xl', 'XXL': 'discounted_price_xxl',
                        'SMALL': 'discounted_price_s', 'MEDIUM': 'discounted_m', 'LARGE': 'discounted_l', 
                        'EXTRA LARGE': 'discounted_xl', '2XL': 'discounted_xxl'
                    }
                    discount_field = size_discount_map.get(s)
                    if discount_field and hasattr(product, discount_field):
                        size_discount = getattr(product, discount_field)
                        if size_discount is not None and size_discount > 0:
                            discount_price = size_discount
                
                # If still no discount price, check product-level
                if discount_price is None and product.discount_price:
                    discount_price = Decimal(str(product.discount_price))
                
                # Effective price for subtotal calculation (use discount if available, else original)
                effective_price = discount_price if discount_price else original_price

                subtotal += (effective_price * quantity)
                order_items_data.append({
                    'product': product,
                    'quantity': quantity,
                    'original_price': original_price,
                    'discount_price': discount_price,
                    'effective_price': effective_price,
                    'size': item.get('size') or item.get('product_size') or None
                })
            except (ValueError, TypeError) as e:
                return JsonResponse({'success': False, 'message': f"Invalid data format: {str(e)}"}, status=400)
        
        if subtotal <= 0:
            return JsonResponse({'success': False, 'message': 'Subtotal must be greater than zero'}, status=400)

        # Apply any coupons sent from client (server-side validation and calculation)
        applied_coupons_input = data.get('applied_coupons', []) or []
        total_coupon_discount = Decimal('0.00')
        applied_coupon_notes = []
        if applied_coupons_input:
            try:
                for cup in applied_coupons_input:
                    code = (cup.get('code') or '').strip()
                    if not code:
                        continue
                    try:
                        coupon_obj = Coupon.objects.get(code__iexact=code, is_active=True)
                    except Coupon.DoesNotExist:
                        continue
                    if hasattr(coupon_obj, 'is_currently_valid') and not coupon_obj.is_currently_valid():
                        continue
                    
                    # One-time use per account check
                    if request.user.is_authenticated:
                        slug_check = f"Coupon {coupon_obj.code}:"
                        if Order.objects.filter(customer__user=request.user, notes__icontains=slug_check).exclude(status='cancelled').exists():
                            print(f"Coupon {code} denied for user {request.user.username} (already used)")
                            continue

                    # compute matched subtotal for this coupon
                    matched = Decimal('0.00')
                    for it in order_items_data:
                        prod = it['product']
                        qty = it['quantity']
                        prod_price = Decimal(str(prod.discount_price if prod.discount_price else prod.price))
                        prod_sub = (prod.sub_category or '').strip()
                        if coupon_obj.sub_category and prod_sub and prod_sub.lower() == coupon_obj.sub_category.lower():
                            matched += (prod_price * qty)
                        elif not coupon_obj.sub_category:
                            matched += (prod_price * qty)

                    if matched <= 0:
                        continue

                    # Calculate discount based on discount_type
                    if coupon_obj.discount_type == '%':
                        discount_amt = (matched * Decimal(str(coupon_obj.discount_value))) / Decimal('100.00')
                    else:
                        # fixed amount discount
                        discount_amt = Decimal(str(coupon_obj.discount_value))
                        if discount_amt > matched:
                            discount_amt = matched

                    # round to 2 decimals
                    discount_amt = discount_amt.quantize(Decimal('0.01'))
                    total_coupon_discount += discount_amt
                    applied_coupon_notes.append(f"Coupon {coupon_obj.code}: -${discount_amt:.2f}")
            except Exception:
                pass

        # Capture gross subtotal (pre-coupon) for shipping calculation
        gross_subtotal = subtotal

        # Subtract coupon discounts from subtotal
        if total_coupon_discount:
            subtotal = max(Decimal('0.00'), subtotal - total_coupon_discount)
        
        # Calculate Taxes (GST 5%)
        tax_amount = subtotal * Decimal('0.05')

        # Shipping Calculation Logic
        SHIPPING_RATE_PER_KG = 4

        def calculate_shipping_cost(qty, cart_subtotal):
            if qty <= 0:
                return Decimal('0.00')
            
            # Box Dimensions: 30 x 10 x (qty * 5)
            # Volume = 30 * 10 * (qty * 5)
            # Dim Weight = Volume / 6000
            # Actual Weight = qty * 5
            
            volume = 30 * 10 * (qty * 5)
            dimensional_weight = volume / 6000
            actual_weight = qty * 5
            
            chargeable_weight = max(dimensional_weight, actual_weight)
            cost = Decimal(str(chargeable_weight)) * Decimal(str(SHIPPING_RATE_PER_KG))
            
            # Free Shipping Rule: If cart subtotal > $200, make it free
            if cart_subtotal > 200:
                return Decimal('0.00')
                
            return cost

        shipping_amount = calculate_shipping_cost(total_quantity, gross_subtotal)
        
        # Calculate Final Total
        total_amount = subtotal + tax_amount + shipping_amount
        
        # Prepare notes with customer name and payment breakdown
        notes_parts = []
        if data.get('notes'):
            notes_parts.append(data.get('notes'))
        
        # Store customer name in notes for admin panel display
        customer_name = f"{first_name} {last_name}".strip()
        if customer_name:
            notes_parts.append(f"Customer Name: {customer_name}")

        # include applied coupon notes if any
        if 'applied_coupon_notes' in locals() and applied_coupon_notes:
            for n in applied_coupon_notes:
                notes_parts.append(n)
        
        # Store payment breakdown in notes
        # Store payment breakdown in notes
        # payment_breakdown = f"Subtotal: {subtotal:.2f} | Tax: {tax_amount:.2f} | Shipping: {shipping_amount:.2f} | Total: {total_amount:.2f}"
        # notes_parts.append(payment_breakdown)
        payment_breakdown = (
            f"Subtotal: CA${subtotal:.2f} | "
            f"GST (5%): CA${tax_amount:.2f} | "
            f"Shipping: CA${shipping_amount:.2f} | "
            f"Total: CA${total_amount:.2f}"
        )
        notes_parts.append(payment_breakdown)



        
        notes = " | ".join(notes_parts) if notes_parts else ""
        print(f"Order creation - Notes to save: '{notes}'")
        print(f"Order creation - Payment breakdown: Subtotal={subtotal:.2f}, Tax={tax_amount:.2f}, Shipping={shipping_amount:.2f}, Total={total_amount:.2f}")
        max_retries = 10
        order_number = None
        for i in range(max_retries):
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            order_number = f"ORD-{timestamp}-{user_identifier}"
            if i > 0:
                order_number = f"{order_number}-{i}"
            
            if not Order.objects.filter(order_number=order_number).exists():
                break
        
        if not order_number:
            return JsonResponse({'success': False, 'message': 'Failed to generate unique order number'}, status=500)
        
        order_customer_name = f"{first_name} {last_name}".strip()
        
        # Create order
        # order = Order.objects.create(
        #     customer=customer,
        #     order_number=order_number,
        #     status='pending',
        #     payment_method='cod' if payment_method == 'cash' else 'online',
        #     payment_status=(payment_method != 'cash'),  # True for online, False for COD
        #     total_amount=total_amount,
        #     shipping_address=shipping_address,
        #     shipping_city=shipping_city,
        #     shipping_state=shipping_state,
        #     shipping_pincode=shipping_pincode,
        #     notes=notes
        # )
        # Create order and related items atomically so partial writes don't occur
        try:
            with transaction.atomic():
                order = Order.objects.create(
                    customer=customer,
                    order_number=order_number,
                    status='pending',
                    payment_method='cod' if payment_method == 'cash' else 'online',
                    payment_status=(payment_method != 'cash'),
                    total_amount=total_amount.quantize(Decimal('0.01')) if isinstance(total_amount, Decimal) else total_amount,
                    # Save payment breakdown from checkout
                    subtotal_amount=subtotal.quantize(Decimal('0.01')) if isinstance(subtotal, Decimal) else subtotal,
                    tax_amount=tax_amount.quantize(Decimal('0.01')) if isinstance(tax_amount, Decimal) else tax_amount,
                    shipping_amount=shipping_amount.quantize(Decimal('0.01')) if isinstance(shipping_amount, Decimal) else shipping_amount,
                    discount_amount=total_coupon_discount.quantize(Decimal('0.01')) if isinstance(total_coupon_discount, Decimal) else total_coupon_discount,
                    shipping_address=shipping_address,
                    shipping_city=shipping_city,
                    shipping_state=shipping_state,
                    shipping_country=data.get('shipping_country', 'US'), # Save Country
                    shipping_pincode=shipping_pincode,
                    notes=f"Customer Name: {order_customer_name} | {notes}"
                )

                # Create order items
                for item_data in order_items_data:
                    original_price_val = Decimal(str(item_data.get('original_price') or 0))
                    discount_price_val = Decimal(str(item_data.get('discount_price') or 0)) if item_data.get('discount_price') else None
                    qty = int(item_data.get('quantity') or 1)
                    
                    # Use effective price for total calculation
                    effective_price_val = discount_price_val if discount_price_val else original_price_val
                    line_total = (effective_price_val * qty).quantize(Decimal('0.01'))
                    
                    OrderItem.objects.create(
                        order=order,
                        product=item_data['product'],
                        product_name=item_data['product'].name,
                        quantity=qty,
                        price=original_price_val,  # Original price
                        discount_price=discount_price_val,  # Discount price (if any)
                        total=line_total,  # Using effective price
                        size=item_data.get('size') or None
                    )

                    # Update product stock: decrement size-specific stock if applicable, and global stock
                    prod_obj = item_data['product']
                    size_raw = item_data.get('size')
                    
                    try:
                        updates = {}
                        # Always decrement overall stock
                        updates['stock'] = F('stock') - qty
                        
                        # Decrement size-specific stock if applicable
                        if size_raw:
                            size_val = str(size_raw).strip().upper()
                            size_field_map = {
                                'S': 'stock_s', 'M': 'stock_m', 'L': 'stock_l', 'XL': 'stock_xl', 'XXL': 'stock_xxl',
                                'SMALL': 'stock_s', 'MEDIUM': 'stock_m', 'LARGE': 'stock_l', 'EXTRA LARGE': 'stock_xl', '2XL': 'stock_xxl',
                                'FREE SIZE': 'stock_s', 'FREESIZE': 'stock_s', 'FREE': 'stock_s'  # Free Size uses stock_s
                            }
                            field_name = size_field_map.get(size_val)
                            
                            # print(f"Order: Processing size '{size_raw}' -> normalized to '{size_val}' -> field '{field_name}'")
                            
                            if field_name:
                                # We assume the field exists if it's in our map.
                                updates[field_name] = F(field_name) - qty
                                # print(f"Order: Will decrement {field_name} for product {prod_obj.id} ({prod_obj.name}) by {qty}")
                            else:
                                pass # print(f"Order: WARNING - Size '{size_val}' not found in size_field_map!")
                        else:
                            pass # print(f"Order: No size specified for product {prod_obj.id} ({prod_obj.name})")

                        # Perform atomic update
                        if updates:
                            # print(f"Order: Executing atomic update for product {prod_obj.id}: {updates}")
                            rows = Product.objects.filter(pk=prod_obj.pk).update(**updates)
                            # print(f"Order: Stock update for product {prod_obj.id} ({prod_obj.name}) affected {rows} rows")
                        else:
                            pass # print(f"Order: WARNING - No updates to perform for product {prod_obj.id}")
                            
                    except Exception as e:
                        print(f"ERROR updating stock for product {prod_obj.id} ({prod_obj.name}): {e}")
                        import traceback
                        traceback.print_exc()
                        # Don't fail the order just because stock update failed, but log it
                        pass
        except Exception:
            # Bubble up error to outer exception handler
            raise
        
        # Create per-item CheckoutDetails rows so each ordered product is stored separately
        try:
            for item_data in order_items_data:
                try:
                    prod = item_data['product']
                    qty = int(item_data.get('quantity') or 1)
                    price_item = Decimal(str(item_data.get('effective_price') or 0))
                    item_subtotal = (price_item * qty)
                    CheckoutDetails.objects.create(
                        billing_email = email,
                        first_name = first_name,
                        last_name = last_name,
                        address = shipping_address,
                        apartment = None,
                        city = shipping_city,
                        state = shipping_state, # Save State
                        postal_code = shipping_pincode,
                        country = data.get('shipping_country', 'US'), # Save Country
                        phone = phone,
                        delivery_method = payment_method,
                        payment_method = payment_method,
                        subtotal = item_subtotal,
                        quantity = qty,
                        shipping = shipping_amount or 0,
                        tax = tax_amount or 0,
                        total = item_subtotal,
                        product_id = prod.slug or str(prod.id),
                        category = getattr(prod, 'category', None),
                        sub_category = getattr(prod, 'sub_category', None),
                        size = item_data.get('size') or None,
                        order_reference = order.order_number
                    )
                except Exception:
                    # ignore per-item save errors
                    pass
        except Exception:
            pass

        # Clear cart items for this customer
        Cart.objects.filter(customer=customer).delete()

        # =================================================
        # SEND ORDER PLACED EMAIL (with PDF)
        # =================================================
        try:
            # Generate PDF
            pdf_file = generate_order_pdf(order)

            # Email Content
            subject = "Order Confirmed 🎉 - HE SHE STYLE WEAR"
            from_email = settings.DEFAULT_FROM_EMAIL
            to_email = [email]

            product_names = ", ".join([item['product'].name for item in order_items_data])
            
            html_content = render_to_string("customer/emails/placed_email.html", {
                "user_name": order_customer_name,
                "order_number": order.order_number,
                "product_name": product_names,
            })

            msg = EmailMultiAlternatives(subject, "", from_email, to_email)
            msg.attach_alternative(html_content, "text/html")

            # Attach Logo (CID)
            logo_path = os.path.join(settings.BASE_DIR, 'customer/static/customer/images/email_logo.png')
            if not os.path.exists(logo_path):
                logo_path = os.path.join(settings.BASE_DIR, 'static/images/logo.png')
            
            if os.path.exists(logo_path):
                with open(logo_path, "rb") as f:
                    logo = MIMEImage(f.read())
                    logo.add_header("Content-ID", "<logo>")
                    logo.add_header("Content-Disposition", "inline", filename="logo.png")
                    msg.attach(logo)
            
            # Attach PDF
            filename = f"Invoice_{order.order_number}.pdf"
            msg.attach(filename, pdf_file, 'application/pdf')

            msg.send()
            print(f"Order Placed Email sent to {to_email}")

        except Exception as e:
            print(f"Error sending order placed email: {e}")
            # Do not fail request entirely, just log
        
        # Store order ID in session for guests to access confirmation page
        if not request.user.is_authenticated:
            request.session['guest_order_id'] = order.id
            request.session.modified = True

        # Determine redirect URL
        if request.user.is_authenticated:
            redirect_url = f'/order/{order.id}/'
        else:
            redirect_url = '/'

        return JsonResponse({
            'success': True,
            'message': 'Order created successfully',
            'order_id': order.id,
            'order_number': order.order_number,
            'redirect_url': redirect_url
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error creating order: {error_details}")  # Log to console for debugging
        return JsonResponse({'success': False, 'message': f'An error occurred: {str(e)}'}, status=500)

def login_view(request):
    """User login view"""
    if request.user.is_authenticated:
        return redirect('index')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        # Check if login input is an email
        if '@' in username:
            try:
                user_obj = User.objects.get(email=username)
                username = user_obj.username
            except User.DoesNotExist:
                pass # Proceed with authentication which will fail gracefully

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, 'Welcome back!')
            
            # --- Country Redirection Logic ---
            try:
                # Check user's stored country
                if hasattr(user, 'customer_profile') and user.customer_profile:
                    user_country = user.customer_profile.country
                    if user_country:
                        # Append region param to redirect URL
                        # 'next' param takes precedence if it exists, otherwise use 'index'
                        # NOTE: If 'next' is present (e.g. cart), we might NOT want to override it with region ONLY, 
                        # but we should probably append it if possible. 
                        # For now, let's prioritize landing them with the correct region context.
                        # If next_url is just 'index' or '/', we can append.
                        
                        next_url = request.GET.get('next', 'index')
                        
                        # If next_url is a relative path like '/cart/', append query param
                        # If it's a named URL 'index', we resolve it (but 'index' usually resolves to '/')
                        
                        # Simple approach: If it's the default index, verify we pass the region
                        if next_url == 'index' or next_url == '/':
                            next_url = f"/?region={user_country.lower()}"
                        elif '?' in next_url:
                             next_url += f"&region={user_country.lower()}"
                        else:
                             next_url += f"?region={user_country.lower()}"

                        return redirect(next_url)
            except Exception as e:
                print(f"Login redirection error: {e}")
                pass
            # ---------------------------------

            next_url = request.GET.get('next', 'index')
            return redirect(next_url)
        else:
            messages.error(request, 'Invalid username/email or password.')
    
    return render(request, "customer/login.html")

from email.mime.image import MIMEImage

def send_otp_email(to_email, user_name, otp):
    """Helper to send OTP email with CID embedded logo (fixes Gmail clipping)"""
    subject = 'Verify Your Email - HE SHE STYLES WEAR'
    from_email = settings.DEFAULT_FROM_EMAIL
    
    # 1. Render template (use minimal context)
    # Note: logo src will be 'cid:logo' in the template
    html_content = render_to_string('customer/emails/otp_email.html', {
        'user_name': user_name,
        'otp': otp
    })
    
    # 2. Construct Email Message with Multipart/Related
    msg = EmailMultiAlternatives(subject, f'Your OTP is {otp}', from_email, [to_email])
    msg.attach_alternative(html_content, "text/html")
    msg.mixed_subtype = 'related' # Defines that the attachment is part of the body
    
    # 3. Attach Logo as Inline Image
    try:
        # Use finders to locate the file, or fallback to absolute path if needed
        # Since I saved it to specific path earlier:
        static_path = os.path.join(settings.BASE_DIR, 'customer/static/customer/images/email_logo.png')
        
        if os.path.exists(static_path):
            with open(static_path, "rb") as f:
                logo_data = f.read()
                logo = MIMEImage(logo_data)
                logo.add_header('Content-ID', '<logo>') # This matches cid:logo
                logo.add_header('Content-Disposition', 'inline', filename='logo.png')
                msg.attach(logo)
        else:
            print(f"Warning: Logo file not found at {static_path}")
            
    except Exception as e:
        print(f"Error attaching logo: {str(e)}")
    
    # 4. Send
    msg.send()

def register_view(request):
    """User registration view with OTP"""
    if request.user.is_authenticated:
        return redirect('index')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        password_confirm = request.POST.get('password_confirm')
        first_name = request.POST.get('first_name', '')
        last_name = request.POST.get('last_name', '')
        country = request.POST.get('country', 'US') # Capture Country Selection
        
        # Validation
        if password != password_confirm:
            messages.error(request, 'Passwords do not match.')
            return render(request, "customer/register.html")
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists.')
            return render(request, "customer/register.html")
        
        if User.objects.filter(email=email).exists():
            messages.error(request, 'Email already registered.')
            return render(request, "customer/register.html")
        
        # Generate OTP
        otp = str(random.randint(100000, 999999))
        
        # Store registration data temporarily in session
        request.session['register_data'] = {
            'username': username,
            'email': email,
            'password': password,
            'first_name': first_name,
            'first_name': first_name,
            'last_name': last_name,
            'country': country, # Store in session
            'otp': otp
        }
        
        # Send OTP Email
        try:
            send_otp_email(email, first_name or username, otp)
            messages.success(request, 'OTP sent to your email. Please verify.')
            return redirect('otp_verify')
        except Exception as e:
            print(f"Error sending email: {e}")
            messages.error(request, 'Failed to send OTP email. Please try again.')
            return render(request, "customer/register.html")
    
    return render(request, "customer/register.html")

def otp_verify_view(request):
    """View to verify OTP"""
    if 'register_data' not in request.session:
        messages.error(request, 'Session expired. Please register again.')
        return redirect('register')
        
    if request.method == 'POST':
        entered_otp = request.POST.get('otp')
        session_data = request.session.get('register_data')
        
        if entered_otp and entered_otp.strip() == session_data.get('otp'):
            # Create User
            try:
                user = User.objects.create_user(
                    username=session_data['username'],
                    email=session_data['email'],
                    password=session_data['password'],
                    first_name=session_data['first_name'],
                    last_name=session_data['last_name']
                )
                Customer.objects.create(
                    user=user,
                    country=session_data.get('country', 'US') # Save Country
                )
                
                # Clear session
                del request.session['register_data']
                
                messages.success(request, 'Registration successful! Please login.')
                return redirect('login')
            except Exception as e:
                messages.error(request, f'Error creating account: {e}')
                return redirect('register')
        else:
            messages.error(request, 'Invalid OTP. Please try again.')
            
    return render(request, 'customer/otp_verify.html')

def resend_otp_view(request):
    """Resend OTP to the user"""
    if 'register_data' not in request.session:
        messages.error(request, 'Session expired. Please register again.')
        return redirect('register')
        
    session_data = request.session['register_data']
    otp = str(random.randint(100000, 999999))
    session_data['otp'] = otp
    request.session['register_data'] = session_data # update session
    
    try:
        send_otp_email(session_data['email'], session_data['first_name'] or session_data['username'], otp)
        messages.success(request, 'A new OTP has been sent to your email.')
    except Exception as e:
        messages.error(request, f'Failed to resend email: {e}')
        
    return redirect('otp_verify')

def logout_view(request):
    """User logout view"""
    logout(request)
    # messages.success(request, 'You have been logged out.') # Message is now static in the template
    return render(request, 'customer/logout_success.html')


def search(request):
    query = request.GET.get('query', '')
    products = Product.objects.filter(name__icontains=query)
    
    return render(request, 'customer/search.html', { 
        'products': products,
        'query': query 
    })


def api_running_banners(request):
    try:
        banners_qs = RunningBanner.objects.filter(enabled=True).order_by('-id').values_list("text", flat=True)
        return JsonResponse({"banners": list(banners_qs)})
    except Exception:
        return JsonResponse({"banners": []})


from django.http import JsonResponse
from customer.models import Product

def filter_kids_products(request):
    gender = "kids"
    category = request.GET.get("category", "")
    fabric = request.GET.get("fabric", "")
    price_range = request.GET.get("price_range", "")
    min_price = request.GET.get("min_price")
    max_price = request.GET.get("max_price")

    qs = Product.objects.filter(gender__iexact=gender)

    if category:
        qs = qs.filter(sub_category__iexact=category)

    if fabric:
        qs = qs.filter(fabric__iexact=fabric)

    if min_price:
        qs = qs.filter(offerprice__gte=min_price)

    if max_price:
        qs = qs.filter(offerprice__lte=max_price)

    if price_range == "under_16":
        qs = qs.filter(offerprice__lt=1000)

    elif price_range == "16_40":
        qs = qs.filter(offerprice__gte=1000, offerprice__lte=2500)

    elif price_range == "over_40":
        qs = qs.filter(offerprice__gt=2500)

    products = list(qs.values(
        "id",
        "name",
        "price",
        "offerprice",
        "image",
        "sub_category",
        "fabric",
    ))

    return JsonResponse({"products": products})


@csrf_exempt
def save_checkout_details(request):
    if request.method == "POST":
        data = json.loads(request.body)
        checkout_id = data.get('checkout_id')
        checkout = None

        # 1️⃣ DRAFT SAVE (Not Final Submission) → Update existing record
        if checkout_id and not data.get('final'):
            try:
                checkout = CheckoutDetails.objects.filter(id=checkout_id).first()
                if checkout:
                    checkout.billing_email = data.get('billing_email') or data.get('email') or checkout.billing_email
                    checkout.first_name = data.get('first_name') or checkout.first_name
                    checkout.last_name = data.get('last_name') or checkout.last_name
                    checkout.address = data.get('address') or checkout.address
                    checkout.apartment = data.get('apartment') or checkout.apartment
                    checkout.city = data.get('city') or checkout.city
                    checkout.state = data.get('state') or checkout.state # Added state
                    checkout.postal_code = data.get('postal_code') or data.get('postal') or checkout.postal_code
                    checkout.country = data.get('country') or checkout.country
                    checkout.phone = data.get('phone') or checkout.phone
                    checkout.delivery_method = data.get('delivery_method') or checkout.delivery_method
                    checkout.payment_method = data.get('payment_method') or checkout.payment_method
                    if data.get('subtotal') is not None:
                        checkout.subtotal = data.get('subtotal')
                    if data.get('shipping') is not None:
                        checkout.shipping = data.get('shipping')
                    if data.get('tax') is not None:
                        checkout.tax = data.get('tax')
                    if data.get('total') is not None:
                        checkout.total = data.get('total')
                    if data.get('order_id'):
                        checkout.order_reference = data.get('order_id')
                    checkout.save()
            except Exception:
                checkout = None

        # 2️⃣ FINAL ORDER CONFIRMATION → Always CREATE NEW RECORD
        else:
            # Attempt to resolve product and its category/sub_category from provided product_id (slug or id)
            category_val = None
            sub_category_val = None
            prod_ref = data.get('product_id')
            if prod_ref:
                try:
                    prod_obj = Product.objects.filter(slug=prod_ref).first()
                    if not prod_obj:
                        try:
                            prod_obj = Product.objects.filter(id=int(prod_ref)).first()
                        except Exception:
                            prod_obj = None
                    if prod_obj:
                        category_val = prod_obj.category
                        sub_category_val = getattr(prod_obj, 'sub_category', None)
                except Exception:
                    category_val = None
                    sub_category_val = None

            checkout = CheckoutDetails.objects.create(
                billing_email=data.get('billing_email') or data.get('email'),
                product_id=data.get('product_id'),
                category=category_val,
                sub_category=sub_category_val,
                size=data.get('size'),
                first_name=data.get('first_name'),
                last_name=data.get('last_name'),
                address=data.get('address'),
                apartment=data.get('apartment'),
                city=data.get('city'),
                state=data.get('state'), # Added state
                postal_code=data.get('postal_code') or data.get('postal'),
                country=data.get('country'),
                phone=data.get('phone'),
                delivery_method=data.get('delivery_method'),
                payment_method=data.get('payment_method'),
                subtotal=data.get('subtotal') or 0,
                quantity=data.get('quantity') or 1,
                shipping=data.get('shipping') or 0,
                tax=data.get('tax') or 0,
                total=data.get('total') or 0,
                order_reference=data.get('order_id') or data.get('order_reference')
            )

        # 3️⃣ Log Payment Event
        try:
            PaymentEvent.objects.create(
                event_type='checkout_saved',
                user=request.user if request.user.is_authenticated else None,
                checkout=checkout,
                order=None,
                metadata=json.dumps({'payload_keys': list(data.keys())})
            )
        except Exception:
            pass

        # 4️⃣ FINAL ORDER CONFIRMATION (Multiple Items) → Create one row PER PRODUCT
        try:
            if data.get('final') and data.get('cart_items'):
                cart_items = data.get('cart_items') or []
                order_ref = data.get('order_id') or data.get('order_reference')
                fallback_ref = str(checkout.id) if checkout else None
                identifier_ref = order_ref or fallback_ref

                for it in cart_items:
                    try:
                        prod_id = it.get('productId') or it.get('product_id') or it.get('id') or it.get('slug')
                        size_val = it.get('size') or it.get('product_size')
                        qty = int(it.get('quantity') or 1)
                        price_val = it.get('price') or it.get('subtotal') or 0

                        # Prevent duplicate entries
                        if CheckoutDetails.objects.filter(order_reference=identifier_ref, product_id=prod_id, size=size_val).exists():
                            continue

                        # Attempt to lookup product category and sub_category from provided id/slug
                        category_val = None
                        sub_category_val = None
                        try:
                            prod_obj = Product.objects.filter(slug=prod_id).first()
                            if not prod_obj:
                                try:
                                    prod_obj = Product.objects.filter(id=int(prod_id)).first()
                                except Exception:
                                    prod_obj = None
                            if prod_obj:
                                category_val = prod_obj.category
                                sub_category_val = getattr(prod_obj, 'sub_category', None)
                        except Exception:
                            category_val = None
                            sub_category_val = None

                        CheckoutDetails.objects.create(
                            billing_email=data.get('billing_email') or data.get('email'),
                            first_name=data.get('first_name'),
                            last_name=data.get('last_name'),
                            address=data.get('address'),
                            city=data.get('city'),
                            postal_code=data.get('postal_code') or data.get('postal'),
                            country=data.get('country'),
                            phone=data.get('phone'),
                            delivery_method=data.get('delivery_method'),
                            payment_method=data.get('payment_method'),
                            subtotal=float(price_val) * qty,
                            quantity=qty,
                            shipping=0,
                            tax=0,
                            total=float(price_val) * qty,
                            product_id=prod_id,
                            category=category_val,
                            sub_category=sub_category_val,
                            size=size_val,
                            order_reference=identifier_ref
                        )

                    except Exception:
                        pass
        except Exception:
            pass

        return JsonResponse({"success": True, "message": "Checkout saved", "checkout_id": checkout.id if checkout else None})

    return JsonResponse({"success": False, "message": "Invalid request"}, status=400)




@csrf_exempt
@require_http_methods(["POST"])
def save_checkout_event(request):
    """Endpoint to record lightweight checkout events (proceed/confirm).

    Expected JSON body: { event: 'proceed_to_payment'|'confirm_payment', order_id: <optional>, checkout_id: <optional>, metadata: { ... } }
    """
    try:
        data = json.loads(request.body)
        event = data.get('event')
        if not event:
            return JsonResponse({'success': False, 'message': 'event required'}, status=400)

        order_obj = None
        checkout_obj = None
        if data.get('order_id'):
            try:
                order_obj = Order.objects.filter(id=data.get('order_id')).first() or Order.objects.filter(order_number=data.get('order_id')).first()
            except Exception:
                order_obj = None
        if data.get('checkout_id'):
            try:
                checkout_obj = CheckoutDetails.objects.filter(id=data.get('checkout_id')).first()
            except Exception:
                checkout_obj = None

        pe = PaymentEvent.objects.create(
            event_type=event,
            user=request.user if request.user.is_authenticated else None,
            order=order_obj,
            checkout=checkout_obj,
            metadata=json.dumps(data.get('metadata') or {})
        )
        return JsonResponse({'success': True, 'message': 'Event recorded', 'event_id': pe.id})
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


def send_test_mail(request):
    send_mail(
        subject="Django Mail Test",
        message="Mail connection successful 🎉",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=["harishjharish24@gmail.com"],
        fail_silently=False,
    )
    return HttpResponse("Mail sent successfully")

@csrf_exempt
@require_http_methods(["POST"])
def cancel_order_api(request):
    """API endpoint to cancel an order and restore stock"""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'User must be logged in'}, status=401)
    
    try:
        data = json.loads(request.body)
        order_id = data.get('order_id')
        reasons = data.get('reasons', [])
        
        if not order_id:
            return JsonResponse({'success': False, 'message': 'Order ID is required'}, status=400)
        
        # Get customer
        try:
            customer = Customer.objects.get(user=request.user)
        except Customer.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Customer profile not found'}, status=404)
        
        # Find order by order_number or ID
        order = None
        try:
            # Try as order_number first
            order = Order.objects.get(order_number=order_id, customer=customer)
        except Order.DoesNotExist:
            try:
                # Try as database ID
                order = Order.objects.get(id=int(order_id), customer=customer)
            except (Order.DoesNotExist, ValueError):
                return JsonResponse({'success': False, 'message': 'Order not found'}, status=404)
        
        # Check if order can be cancelled
        if order.status == 'cancelled':
            return JsonResponse({'success': False, 'message': 'Order is already cancelled'}, status=400)
        
        if order.status in ['shipped', 'delivered', 'shipping', 'fulfilled']:
            return JsonResponse({'success': False, 'message': 'Orders cannot be cancelled after they have been processed/shipped. Please use return after delivery.'}, status=400)
        
        # Use transaction to ensure atomicity
        with transaction.atomic():
            # Restore stock for each order item
            for order_item in order.items.all():
                product = order_item.product
                quantity_to_restore = order_item.quantity
                size = order_item.size if hasattr(order_item, 'size') else None
                
                # Restore stock based on size
                if size:
                    size_upper = size.upper().strip()
                    if size_upper == 'S' and hasattr(product, 'stock_s'):
                        product.stock_s = (product.stock_s or 0) + quantity_to_restore
                    elif size_upper == 'M' and hasattr(product, 'stock_m'):
                        product.stock_m = (product.stock_m or 0) + quantity_to_restore
                    elif size_upper == 'L' and hasattr(product, 'stock_l'):
                        product.stock_l = (product.stock_l or 0) + quantity_to_restore
                    elif size_upper == 'XL' and hasattr(product, 'stock_xl'):
                        product.stock_xl = (product.stock_xl or 0) + quantity_to_restore
                    elif size_upper == 'XXL' and hasattr(product, 'stock_xxl'):
                        product.stock_xxl = (product.stock_xxl or 0) + quantity_to_restore
                    elif size_upper in ('FREE SIZE', 'FREESIZE', 'FREE') and hasattr(product, 'stock_s'):
                        # Free Size products use stock_s
                        product.stock_s = (product.stock_s or 0) + quantity_to_restore
                
                # ALWAYS restore general stock (since it is always decremented)
                product.stock = (product.stock or 0) + quantity_to_restore
                
                product.save()
            
            # Update order status to cancelled
            order.status = 'cancelled'
            
            # Store cancellation reasons
            order.cancel_reason = ", ".join(reasons)
            
            # Legacy/Fallback (Optional, keeping for safety)
            if hasattr(order, 'cancellation_reasons'):
                 order.cancellation_reasons = reasons

            
            order.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Order cancelled successfully',
            'order': {
                'order_id': order.id,
                'order_number': order.order_number,
                'status': order.status,
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'message': f'Error cancelling order: {str(e)}'}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def return_order_api(request):
    """API endpoint to request return for a delivered order"""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'User must be logged in'}, status=401)
    
    try:
        data = json.loads(request.body)
        order_id = data.get('order_id')
        reasons = data.get('reasons', [])
        
        if not order_id:
            return JsonResponse({'success': False, 'message': 'Order ID is required'}, status=400)
        
        # Get customer
        try:
            customer = Customer.objects.get(user=request.user)
        except Customer.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Customer profile not found'}, status=404)
        
        # Find order by order_number or ID
        order = None
        try:
            # Try as order_number first
            order = Order.objects.get(order_number=order_id, customer=customer)
        except Order.DoesNotExist:
            try:
                # Try as database ID
                order = Order.objects.get(id=int(order_id), customer=customer)
            except (Order.DoesNotExist, ValueError):
                return JsonResponse({'success': False, 'message': 'Order not found'}, status=404)
        
        # Auto-Fulfill Check (Updates status if expired)
        check_and_fulfill_order(order)
        
        # Check if order can be returned
        if order.status != 'delivered':
             return JsonResponse({'success': False, 'message': 'Only delivered orders can be returned (or return window expired)'}, status=400)
             
        # Re-validate Return Window manually if needed 
        # (Though check_and_fulfill_order handles expiration status change, 
        # we still want to block if for some reason status didn't update but calculation says expired? 
        # No, check_and_fulfill_order is the source of truth for expiration now.
        # If it didn't expire, it returns false and status remains delivered.)

        # Still need the variables for logic below? No, we trust the status.
        # Actually, let's keep it simple. If status is 'fulfilled', we already returned error above.

        # Update order status to return_requested
        # Note: You may need to add 'return_requested' to STATUS_CHOICES in the Order model
        # For now, we'll use a note to indicate return request
        order.status = 'return_requested' if 'return_requested' in [choice[0] for choice in Order.STATUS_CHOICES] else 'delivered'
        
        # Store return reasons
        order.cancel_reason = ", ".join(reasons)
        
        # Legacy/Fallback
        if hasattr(order, 'return_reasons'):
            order.return_reasons = reasons
        
        order.save()

        # Send Return Requested Email
        try:
             # Determine generic user name
             user_name = "Customer"
             if request.user.first_name:
                 user_name = f"{request.user.first_name} {request.user.last_name}".strip()
             elif hasattr(order.customer, 'user') and order.customer.user:
                   user_name = order.customer.user.first_name or order.customer.user.username
             
             # Prepare context
             email_context = {
                 'user_name': user_name,
                 'order_number': order.order_number,
             }
             
             # Render HTML
             html_content = render_to_string('customer/emails/return_requested_email.html', email_context)
             
             # Determine recipient (Robust Lookup)
             to_email = None
             
             # 1. Try CheckoutDetails (Billing Email) - Most Reliable
             try:
                 checkout_details = CheckoutDetails.objects.filter(order_reference=order.order_number).first()
                 if checkout_details and checkout_details.billing_email:
                     to_email = checkout_details.billing_email
             except Exception:
                 pass
             
             # 2. Try User Email (from Request)
             if not to_email and request.user.email:
                 to_email = request.user.email
                 
             # 3. Try Customer User Email
             if not to_email and hasattr(order.customer, 'user') and order.customer.user and order.customer.user.email:
                 to_email = order.customer.user.email
             
             if to_email:
                 subject = "Return Requested ↩️ - HE SHE STYLE WEAR"
                 from_email = settings.DEFAULT_FROM_EMAIL
                 msg = EmailMultiAlternatives(subject, f"Return requested for Order #{order.order_number}", from_email, [to_email])
                 msg.attach_alternative(html_content, "text/html")
                 msg.mixed_subtype = 'related'
                 
                 # Attach Logo
                 logo_path = os.path.join(settings.BASE_DIR, 'customer/static/customer/images/email_logo.png')
                 if not os.path.exists(logo_path):
                        logo_path = os.path.join(settings.BASE_DIR, 'static/images/logo.png')

                 if os.path.exists(logo_path):
                    with open(logo_path, "rb") as f:
                        logo = MIMEImage(f.read())
                        logo.add_header("Content-ID", "<logo>")
                        logo.add_header("Content-Disposition", "inline", filename="logo.png")
                        msg.attach(logo)
                 
                 msg.send()
                 print(f"Return requested email sent to {to_email}")
             else:
                 print(f"WARNING: Could not determine email for Order #{order.order_number}. User: {request.user}")
                 
        except Exception as e:
            print(f"Error sending return email: {e}")
        
        return JsonResponse({
            'success': True,
            'message': 'Return request submitted successfully',
            'order': {
                'order_id': order.id,
                'order_number': order.order_number,
                'status': order.status,
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'message': f'Error submitting return request: {str(e)}'}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def submit_review_api(request):
    """API endpoint to submit a product review"""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'User must be logged in'}, status=401)
    
    try:
        # Handle multipart/form-data for images
        product_id = request.POST.get('product_id')
        rating = request.POST.get('rating')
        comment = request.POST.get('comment', '')
        
        if not product_id or not rating:
            return JsonResponse({'success': False, 'message': 'Product ID and rating are required'}, status=400)
            
        try:
            rating = int(rating)
            if not (1 <= rating <= 5):
                raise ValueError
        except ValueError:
            return JsonResponse({'success': False, 'message': 'Rating must be an integer between 1 and 5'}, status=400)
            
        # Try to find product by slug or ID
        try:
            product = Product.objects.get(slug=product_id)
        except Product.DoesNotExist:
            try:
                product = Product.objects.get(id=product_id)
            except (Product.DoesNotExist, ValueError):
                return JsonResponse({'success': False, 'message': 'Product not found'}, status=404)
        
        # Check if user already reviewed this product
        if Review.objects.filter(product=product, user=request.user).exists():
            return JsonResponse({'success': False, 'message': 'You have already reviewed this product'}, status=400)
        
        # Create review
        review = Review(
            product=product,
            user=request.user,
            rating=rating,
            comment=comment,
            # Check if user purchased this product for verified status
            is_verified=Order.objects.filter(customer__user=request.user, items__product=product, status='delivered').exists()
        )
        
        # Handle images if provided
        if 'image1' in request.FILES:
            review.image1 = request.FILES['image1']
        if 'image2' in request.FILES:
            review.image2 = request.FILES['image2']
        if 'image3' in request.FILES:
            review.image3 = request.FILES['image3']
            
        review.save()
        
        return JsonResponse({
            'success': True, 
            'message': 'Review submitted successfully',
            'review': {
                'id': review.id,
                'rating': review.rating,
                'comment': review.comment,
                'user': request.user.first_name or request.user.username,
                'created_at': review.created_at.strftime('%Y-%m-%d')
            }
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

@require_http_methods(["GET"])
def get_product_reviews_api(request, product_id):
    """API endpoint to get reviews for a product"""
    try:
        # Try to find product by slug or ID
        try:
            product = Product.objects.get(slug=product_id)
        except Product.DoesNotExist:
            try:
                product = Product.objects.get(id=product_id)
            except (Product.DoesNotExist, ValueError):
                return JsonResponse({'success': False, 'message': 'Product not found'}, status=404)
        
        reviews = Review.objects.filter(product=product).order_by('-created_at')
        
        reviews_data = []
        for review in reviews:
            reviews_data.append({
                'id': review.id,
                'user': review.user.first_name or review.user.username,
                'rating': review.rating,
                'comment': review.comment,
                'is_verified': review.is_verified,
                'created_at': review.created_at.strftime('%Y-%m-%d'),
                'images': [
                    img.url for img in [review.image1, review.image2, review.image3] if img
                ]
            })
            
        # specific logic for user_can_review
        user_can_review = False
        is_authenticated = request.user.is_authenticated
        
        if is_authenticated:
            # Check if user has purchased the product (delivered)
            has_purchased = Order.objects.filter(
                customer__user=request.user, 
                items__product=product,
                status='delivered'
            ).exists()
            
            # Check if already reviewed
            has_reviewed = Review.objects.filter(product=product, user=request.user).exists()
            
            if has_purchased and not has_reviewed:
                user_can_review = True

        return JsonResponse({
            'success': True, 
            'reviews': reviews_data,
            'rating_data': product.get_rating_data(),
            'user_can_review': user_can_review,
            'is_authenticated': is_authenticated
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def request_return(request):
    """
    API endpoint for user to request a return.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Authentication required'}, status=401)

    try:
        data = json.loads(request.body)
        order_id = data.get('order_id')
        reason = data.get('reason')

        if not order_id or not reason:
            return JsonResponse({'success': False, 'message': 'Order ID and return reason are required'}, status=400)

        # Get customer profile
        try:
            customer = Customer.objects.get(user=request.user)
        except Customer.DoesNotExist:
             return JsonResponse({'success': False, 'message': 'Customer profile not found'}, status=404)

        # Get order and ensure it belongs to the user
        try:
            # Try by ID first
            order = Order.objects.get(id=order_id, customer=customer)
        except (Order.DoesNotExist, ValueError):
             try:
                 # Try by number
                 order = Order.objects.get(order_number=order_id, customer=customer)
             except Order.DoesNotExist:
                 return JsonResponse({'success': False, 'message': 'Order not found'}, status=404)

        # Update status
        order.status = 'return_requested'
        order.return_reason = reason
        order.save()

        return JsonResponse({
            'success': True,
            'message': 'Return requested successfully',
            'order_status': order.get_status_display()
        })

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)



def check_and_fulfill_order(order):
    """
    Checks if a delivered order has passed the 5-day return window.
    If yes, updates status to 'fulfilled'.
    Returns True if status was changed, False otherwise.
    """
    if order.status != 'delivered':
        return False

    if not order.delivered_at:
        # Fallback logic mirroring return_order_api
        delivery_date = order.updated_at
    else:
        delivery_date = order.delivered_at
        
    # Ensure dependencies are available (if not at top level)
    from datetime import timedelta, timezone as dt_timezone
    from django.utils import timezone
    
    # IST Offset
    ist_offset = timedelta(hours=5, minutes=30)
    ist_tz = dt_timezone(ist_offset)
    
    # Ensure aware
    if timezone.is_naive(delivery_date):
        delivery_date = timezone.make_aware(delivery_date)
    
    delivery_at_ist = delivery_date.astimezone(ist_tz)
    
    # Effective Date = Delivered - 1 day
    effective_delivery_date = delivery_at_ist - timedelta(days=1)
    
    # Deadline = Effective + 5 days
    return_deadline = effective_delivery_date + timedelta(days=5)
    
    # End of Day Deadline
    return_deadline_eod = return_deadline.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Now IST
    now_ist = timezone.now().astimezone(ist_tz)
    
    if now_ist > return_deadline_eod:
        order.status = 'fulfilled'
        order.save()
        # Optionally log this change?
        # print(f"Order #{order.order_number} auto-fulfilled. Deadline: {return_deadline_eod}, Now: {now_ist}")
        return True
        
    return False

@login_required
@require_http_methods(["POST"])
def update_profile_api(request):
    try:
        data = json.loads(request.body)
        
        # Update User model fields
        user = request.user
        if 'firstName' in data:
            user.first_name = data['firstName']
        if 'lastName' in data:
            user.last_name = data['lastName']
        
        # Handle Email Update
        if 'email' in data and data['email'] != user.email:
             # Check for uniqueness
             if User.objects.filter(email=data['email']).exclude(pk=user.pk).exists():
                 return JsonResponse({'success': False, 'message': 'Email already in use.'}, status=400)
             user.email = data['email']
        
        user.save()
        
        # Update Customer model fields
        customer, created = Customer.objects.get_or_create(user=user)
        
        if 'addressLine' in data:
            customer.address = data['addressLine']
            if 'addressLocality' in data and data['addressLocality']:
                customer.address += f", {data['addressLocality']}"

        if 'addressCity' in data:
            customer.city = data['addressCity']
        if 'addressState' in data:
            customer.state = data['addressState']
        if 'addressPincode' in data:
            customer.pincode = data['addressPincode']
        
        customer.save()
        
        return JsonResponse({'success': True, 'message': 'Profile updated successfully'})
        
    except Exception as e:
        print(f"Error updating profile: {e}")
        return JsonResponse({'success': False, 'message': 'An error occurred while saving profile.'}, status=500)


def api_running_banners(request):
    banners = RunningBanner.objects.filter(enabled=True).order_by('-id').values_list("text", flat=True)
    return JsonResponse({"banners": list(banners)})


# ==========================================
# FORGOT PASSWORD FLOW
# ==========================================

def forgot_password_view(request):
    """View to initiate password reset via email OTP"""
    if request.user.is_authenticated:
        return redirect('index')

    if request.method == 'POST':
        email = request.POST.get('email')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            messages.error(request, 'Email not registered.')
            return render(request, "customer/forgot_password.html")

        # Generate OTP
        otp = str(random.randint(100000, 999999))
        
        # Store in session
        request.session['forgot_pwd_data'] = {
            'email': email,
            'otp': otp
        }
        
        # Send Email
        try:
            send_otp_email(email, user.first_name or user.username, otp)
            messages.success(request, 'OTP sent to your email. Please verify.')
            return redirect('forgot_password_verify')
        except Exception as e:
            print(f"Error sending email: {e}")
            messages.error(request, 'Failed to send OTP email. Please try again.')
            return render(request, "customer/forgot_password.html")

    return render(request, "customer/forgot_password.html")


def forgot_password_verify_view(request):
    """View to verify OTP for password reset"""
    if 'forgot_pwd_data' not in request.session:
        messages.error(request, 'Session expired. Please start over.')
        return redirect('forgot_password')
        
    if request.method == 'POST':
        entered_otp = request.POST.get('otp')
        session_data = request.session.get('forgot_pwd_data')
        
        if entered_otp and entered_otp.strip() == session_data.get('otp'):
            # Mark as verified
            request.session['reset_authorized'] = True
            messages.success(request, 'OTP Verified. Set your new password.')
            return redirect('reset_password')
        else:
            messages.error(request, 'Invalid OTP. Please try again.')
            
    return render(request, 'customer/forgot_password_verify.html')


def reset_password_view(request):
    """View to set new password"""
    if 'forgot_pwd_data' not in request.session or not request.session.get('reset_authorized'):
        messages.error(request, 'Unauthorized access. Please start over.')
        return redirect('forgot_password')

    if request.method == 'POST':
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')
        
        if password != confirm_password:
            messages.error(request, 'Passwords do not match.')
            return render(request, 'customer/reset_password.html')
            
        session_data = request.session['forgot_pwd_data']
        email = session_data['email']
        
        try:
            user = User.objects.get(email=email)
            user.set_password(password)
            user.save()
            
            # Clear session
            if 'forgot_pwd_data' in request.session:
                del request.session['forgot_pwd_data']
            if 'reset_authorized' in request.session:
                del request.session['reset_authorized']
                
            messages.success(request, 'Password reset successful. Please login with your new password.')
            return redirect('login')
        except User.DoesNotExist:
            messages.error(request, 'User not found.')
            return redirect('forgot_password')
            
    return render(request, 'customer/reset_password.html')
