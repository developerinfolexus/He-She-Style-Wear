from .models import Product, SubCategory

def header_categories(request):
    """
    Context processor to make SubCategory objects available in header.
    Returns active SubCategory objects for Women and Kids.
    """
    try:
        # Get active SubCategory objects
        women_subcats = SubCategory.objects.filter(
            gender__iexact='women', 
            is_active=True
        ).order_by('name')
        
        kids_subcats = SubCategory.objects.filter(
            gender__iexact='kids', 
            is_active=True
        ).order_by('name')
        
        return {
            'header_women_subcats': women_subcats,
            'header_kids_subcats': kids_subcats,
        }
    except Exception as e:
        print(f"Error in header_categories: {e}")
        return {
            'header_women_subcats': [],
            'header_kids_subcats': [],
        }

