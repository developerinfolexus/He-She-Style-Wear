#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script to update all admin panel templates to use Django static files and URL patterns
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

def update_template(file_path):
    """Update a single template file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Add {% load static %} at the top if not present
    if '{% load static %}' not in content:
        # Find the first <link or <script tag or <head>
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
    
    # Replace HTML links with Django URL patterns
    for html_file, url_name in URL_MAPPINGS.items():
        # Replace href="filename.html" (case insensitive)
        content = re.sub(
            rf'href=["\']{re.escape(html_file)}["\']',
            rf'href="{{\% url \'{url_name}\' \%}}"',
            content,
            flags=re.IGNORECASE
        )
    
    # Add "View Customer Site" link before closing sidebar nav if not present
    if 'View Customer Site' not in content and '</nav>' in content:
        # Find the last </nav> before </aside>
        nav_close_match = re.search(r'</nav>\s*</aside>', content, re.IGNORECASE)
        if nav_close_match:
            view_site_link = '''    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
        <a href="{% url 'index' %}" style="color: #4CAF50; display: flex; align-items: center; gap: 10px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            View Customer Site
        </a>
    </div>
'''
            pos = nav_close_match.start()
            content = content[:pos] + view_site_link + content[pos:]
    
    # Add "Add Media" link in products page navigation if not present
    if 'products.html' in os.path.basename(file_path) or 'products' in file_path.lower():
        if 'Add Media' not in content and 'admin_addmedia' not in content:
            # Find the "Add New Product" link and add "Add Media" after it
            add_product_match = re.search(r'href="{% url \'admin_add_product\' %}"', content)
            if add_product_match:
                # Look for the header-actions div and add Add Media link
                header_actions_match = re.search(r'<div class="header-actions">', content)
                if header_actions_match:
                    add_media_link = '                            <a href="{% url \'admin_addmedia\' %}" class="btn btn-primary">Add Media</a>\n'
                    pos = header_actions_match.end()
                    # Find the closing tag of the first link
                    next_link_match = re.search(r'</a>', content[pos:])
                    if next_link_match:
                        insert_pos = pos + next_link_match.end()
                        # Check if Add Media is already there
                        if 'Add Media' not in content[pos:insert_pos+50]:
                            content = content[:insert_pos] + '\n' + add_media_link + content[insert_pos:]
    
    # Only write if content changed
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Updated: {file_path}")
        return True
    return False

def main():
    """Main function to update all admin panel templates"""
    admin_templates_dir = 'boutique_backend/adminpanel/templates/adminpanel'
    
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
            print(f"✗ File not found: {file_path}")
    
    print(f"\n✓ Updated {updated_count} template(s)")

if __name__ == '__main__':
    main()

