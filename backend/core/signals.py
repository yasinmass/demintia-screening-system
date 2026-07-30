from allauth.socialaccount.signals import social_account_added
from django.dispatch import receiver
from .models import User, Patient, Doctor


# NOTE: The post_save auto-profile creation signal has been intentionally removed.
# Patient and Doctor profiles are explicitly created in signup_view and doctor_signup_view
# respectively. Auto-creating them here caused a duplicate email IntegrityError because
# the signal fires during User.objects.create_user() BEFORE the view's Patient.objects.create().


@receiver(social_account_added)
def social_login_profile_setup(request, sociallogin, **kwargs):
    """
    Sets up the profile when a user logs in via Google for the first time.
    Only runs if no profile exists yet (prevents double-creation).
    """
    user = sociallogin.user
    if not hasattr(user, 'patient_profile') and not hasattr(user, 'doctor_profile'):
        user.role = 'patient'
        user.save()
        Patient.objects.get_or_create(
            user=user,
            defaults={
                'email': user.email,
                'name': user.get_full_name() or user.email,
                'password': '',
            }
        )
