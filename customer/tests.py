from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from customer.models import Customer
import json

class ProfileUpdateParamsTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='password')
        self.customer = Customer.objects.create(
            user=self.user,
            address='123 Initial St',
            city='Initial City',
            state='Initial State',
            pincode='123456'
        )
        self.client.login(username='testuser', password='password')
        self.url = reverse('update_profile_api')

    def test_update_profile_success(self):
        payload = {
            'firstName': 'NewFirst',
            'lastName': 'NewLast',
            'email': 'newemail@example.com',
            'addressLine': '456 New St',
            'addressCity': 'New City',
            'addressState': 'New State',
            'addressPincode': '654321',
            # 'country': 'United States' # Country not in model, ignored
        }
        
        response = self.client.post(
            self.url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        
        # Verify DB updates
        self.user.refresh_from_db()
        self.customer.refresh_from_db()
        
        self.assertEqual(self.user.first_name, 'NewFirst')
        self.assertEqual(self.user.last_name, 'NewLast')
        self.assertEqual(self.user.email, 'newemail@example.com')
        
        self.assertEqual(self.customer.address, '456 New St')
        self.assertEqual(self.customer.city, 'New City')
        self.assertEqual(self.customer.state, 'New State')
        self.assertEqual(self.customer.pincode, '654321')

    def test_update_email_duplicate_fail(self):
        # Create another user
        User.objects.create_user(username='other', email='taken@example.com', password='password')
        
        payload = {
            'email': 'taken@example.com'
        }
        
        response = self.client.post(
            self.url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('Email already in use', data['message'])
