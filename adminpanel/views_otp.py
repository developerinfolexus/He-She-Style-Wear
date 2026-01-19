
# --- Forgot Password API Views ---

@csrf_exempt
@require_http_methods(["POST"])
def api_forgot_pass_generate_otp(request):
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip()
        if not email:
            return JsonResponse({'success': False, 'message': 'Email is required'})

        try:
            # Must be staff/admin
            user = User.objects.get(email__iexact=email, is_staff=True)
        except User.DoesNotExist:
             return JsonResponse({'success': False, 'message': 'Admin account not found with this email'})

        # Generate OTP
        otp_code = str(random.randint(100000, 999999))

        # Save to DB
        admin_otp, created = AdminOTP.objects.get_or_create(user=user)
        admin_otp.otp_code = otp_code
        admin_otp.save() # Updates created_at

        # Send Email
        try:
            send_mail(
                'He She Style Wear Admin Password Reset',
                f'Your OTP for password reset is: {otp_code}. It is valid for 10 minutes.',
                'noreply@hesheboutique.com',
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            return JsonResponse({'success': False, 'message': f'Failed to send email: {str(e)}'})

        return JsonResponse({'success': True, 'message': 'OTP sent to your email'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})

@csrf_exempt
@require_http_methods(["POST"])
def api_verify_pass_otp(request):
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip()
        otp_input = data.get('otp', '').strip()

        try:
            user = User.objects.get(email__iexact=email, is_staff=True)
            admin_otp = AdminOTP.objects.get(user=user)
        except (User.DoesNotExist, AdminOTP.DoesNotExist):
            return JsonResponse({'success': False, 'message': 'Invalid request'})

        if not admin_otp.is_valid():
            return JsonResponse({'success': False, 'message': 'OTP has expired'})

        if admin_otp.otp_code != otp_input:
             return JsonResponse({'success': False, 'message': 'Invalid OTP'})

        admin_otp.is_verified = True
        admin_otp.save()

        return JsonResponse({'success': True, 'message': 'OTP verified'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})

@csrf_exempt
@require_http_methods(["POST"])
def api_reset_pass_confirm(request):
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip()
        password = data.get('password')

        if not password or len(password) < 6:
            return JsonResponse({'success': False, 'message': 'Password must be at least 6 characters'})

        try:
            user = User.objects.get(email__iexact=email, is_staff=True)
            admin_otp = AdminOTP.objects.get(user=user)
        except (User.DoesNotExist, AdminOTP.DoesNotExist):
            return JsonResponse({'success': False, 'message': 'Invalid request'})

        # Double check verification to prevent bypassing
        if not admin_otp.is_verified:
             return JsonResponse({'success': False, 'message': 'OTP not verified'})
             
        if not admin_otp.is_valid():
             return JsonResponse({'success': False, 'message': 'Session expired. Please start over.'})

        # Set Password
        user.set_password(password)
        user.save()

        # Invalidate OTP
        admin_otp.delete()

        return JsonResponse({'success': True, 'message': 'Password reset successfully!'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})
