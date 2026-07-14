from django.db.models.signals import post_save
from django.dispatch import receiver
from allauth.socialaccount.signals import social_account_added
from .models import User, Patient, Doctor

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Automatically creates a profile for users created via standard Django admin or signup.
    Defaulting to patient if not specified.
    """
    if created:
        if instance.role == 'patient' and not hasattr(instance, 'patient_profile'):
            Patient.objects.get_or_create(user=instance, email=instance.email, name=instance.get_full_name() or instance.username)
        elif instance.role == 'doctor' and not hasattr(instance, 'doctor_profile'):
            Doctor.objects.get_or_create(user=instance, email=instance.email, name=instance.get_full_name() or instance.username)

@receiver(social_account_added)
def social_login_profile_setup(request, sociallogin, **kwargs):
    """
    Sets up the profile when a user logs in via Google for the first time.
    """
    user = sociallogin.user
    # New social users should default to 'patient' unless we add a role selection step
    if not hasattr(user, 'patient_profile') and not hasattr(user, 'doctor_profile'):
        user.role = 'patient'
        user.save()
        Patient.objects.create(
            user=user,
            email=user.email,
            name=user.get_full_name() or user.username
        )
