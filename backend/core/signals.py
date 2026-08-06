from allauth.socialaccount.signals import social_account_added
from django.dispatch import receiver
from .models import Patient


@receiver(social_account_added)
def social_login_profile_setup(request, sociallogin, **kwargs):
    user = sociallogin.user
    if (
        not hasattr(user, 'patient_profile')
        and not hasattr(user, 'doctor_profile')
    ):
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
