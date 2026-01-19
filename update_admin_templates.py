#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script to update admin panel templates to use Django static files and URL patterns
"""
import os
import re

# Django URL name mappings
URL_MAPPINGS = {
    'dashboard.html': 'admin_dashboard',
    'products.html': 'admin_products',
    'add-product.html': 'admin_add_product',
    'addmedia.html': 'admin_addmedia',
    'orders.html': 'admin_orders',
    'customers.html': 'admin_customers',
    'analytics.html': 'admin_analytics',
    'settings.html': 'admin_settings',
}

# CSS/JS path mappings
STATIC_MAPPINGS = {
    'css/': 'adminpanel/css/',
    'js/': 'adminpanel/js/',
}

def update_template(file_path):
    """Update a single template file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Add {% load static %} at the top if not present
    if '{% load static %}' not in content:
        # Find the first <link or <script tag
        head_match = re.search(r'<head>', content, re.IGNORECASE)
        if head_match:
            pos = head_match.end()
            content = content[:pos] + '\n    {% load static %}' + content[pos:]
    
    # Replace CSS links
    content = re.sub(
        r'href=["\']css/([^"\']+)["\']',
        r'href="{% static \'adminpanel/css/\1\' %}"',
        content
    )
    
    # Replace JS script sources
    content = re.sub(
        r'src=["\']js/([^"\']+)["\']',
        r'src="{% static \'adminpanel/js/\1\' %}"',
        content
    )
    
    # Replace image sources in static paths
    content = re.sub(
        r'src=["\']([^"\']*\.(png|jpg|jpeg|gif|svg))["\']',
        lambda m: f'src="{% static \'{m.group(1)}\' %}"' if not m.group(1).startswith('http') and not m.group(1).startswith('/') else m.group(0),
        content
    )
    
    # Replace HTML links with Django URL patterns
    for html_file, url_name in URL_MAPPINGS.items():
        # Replace href="filename.html"
        content = re.sub(
            rf'href=["\']{re.escape(html_file)}["\']',
            rf'href="{{\% url \'{url_name}\' \%}}"',
            content,
            flags=re.IGNORECASE
        )
    
    # Only write if content changed
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {file_path}")
        return True
    return False

def main():
    """Main function to update all admin panel templates"""
    admin_templates_dir = 'adminpanel/templates/adminpanel'
    
    if not os.path.exists(admin_templates_dir):
        print(f"Directory not found: {admin_templates_dir}")
        return
    
    templates = [
        'dashboard.html',
        'products.html',
        'add-product.html',
        'addmedia.html',
        'orders.html',
        'customers.html',
        'analytics.html',
        'settings.html',
    ]
    
    updated_count = 0
    for template in templates:
        file_path = os.path.join(admin_templates_dir, template)
        if os.path.exists(file_path):
            if update_template(file_path):
                updated_count += 1
        else:
            print(f"File not found: {file_path}")
    
    print(f"\nUpdated {updated_count} template(s)")

if __name__ == '__main__':
    main()

