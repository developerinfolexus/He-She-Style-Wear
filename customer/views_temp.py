
@csrf_exempt
@require_http_methods(["POST"])
def submit_review_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'You must be logged in to submit a review'}, status=401)
    
    try:
        data = json.loads(request.body)
        product_slug = data.get('product_id')
        rating = data.get('rating')
        comment = data.get('comment', '')
        
        if not product_slug or not rating:
            return JsonResponse({'success': False, 'message': 'Product and rating are required'}, status=400)
            
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                raise ValueError
        except ValueError:
             return JsonResponse({'success': False, 'message': 'Rating must be an integer between 1 and 5'}, status=400)

        # Resolve Product
        try:
            product = Product.objects.get(slug=product_slug)
        except Product.DoesNotExist:
            try:
                product = Product.objects.get(id=product_slug)
            except:
                return JsonResponse({'success': False, 'message': 'Product not found'}, status=404)

        # 1. Check if User has already reviewed
        if Review.objects.filter(user=request.user, product=product).exists():
            return JsonResponse({'success': False, 'message': 'You have already reviewed this product'}, status=400)

        # 2. Check Eligibility: Order exists, status='delivered'
        # Link: Order -> items -> product. And Order -> customer -> user.
        has_purchased = OrderItem.objects.filter(
            order__customer__user=request.user,
            product=product,
            order__status='delivered'
        ).exists()
        
        if not has_purchased:
             return JsonResponse({'success': False, 'message': 'You can only review products you have purchased and received.'}, status=403)

        # 3. Create Review
        review = Review.objects.create(
            user=request.user,
            product=product,
            rating=rating,
            comment=comment,
            is_verified=True # Validated against backend DB
        )
        
        return JsonResponse({'success': True, 'message': 'Review submitted successfully'})

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

@require_http_methods(["GET"])
def get_product_reviews_api(request, product_id):
    try:
        # Resolve Product
        try:
            product = Product.objects.get(slug=product_id)
        except Product.DoesNotExist:
             product = Product.objects.get(id=product_id)
             
        reviews = Review.objects.filter(product=product).select_related('user').order_by('-created_at')
        
        # Calculate stats
        total_reviews = reviews.count()
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        
        reviews_data = []
        for r in reviews:
            reviews_data.append({
                'id': r.id,
                'user': r.user.first_name or r.user.username,
                'rating': r.rating,
                'comment': r.comment,
                'is_verified': r.is_verified,
                'created_at': r.created_at.strftime('%Y-%m-%d'),
            })
            
        # Check if current user can review
        can_review = False
        if request.user.is_authenticated:
            # Not already reviewed
             if not Review.objects.filter(user=request.user, product=product).exists():
                 # Has purchased & delivered
                 can_review = OrderItem.objects.filter(
                    order__customer__user=request.user,
                    product=product,
                    order__status='delivered'
                ).exists()

        return JsonResponse({
            'success': True,
            'reviews': reviews_data,
            'stats': {
                'total_reviews': total_reviews,
                'average_rating': round(avg_rating, 1)
            },
            'user_can_review': can_review
        })

    except Product.DoesNotExist:
         return JsonResponse({'success': False, 'message': 'Product not found'}, status=404)
    except Exception as e:
         return JsonResponse({'success': False, 'message': str(e)}, status=500)
