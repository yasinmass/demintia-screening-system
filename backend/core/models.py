from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.contrib.auth.hashers import make_password


# ─────────────────────────────────────────────
#  Custom User Model (required for allauth)
# ─────────────────────────────────────────────

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model for Dementia Screening System."""
    ROLE_CHOICES = [
        ('patient', 'Patient'),
        ('doctor', 'Doctor'),
        ('admin', 'Admin'),
        
    ]
    def get_full_name(self):
        return self.email

    def get_short_name(self):
        return self.email
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='patient')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"


# ─────────────────────────────────────────────
#  Doctor Model
# ─────────────────────────────────────────────

class Doctor(models.Model):
    """Stores registered doctor information."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile', null=True, blank=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=256)  
    specialization = models.CharField(max_length=200, default='Neurology')
    license_number = models.CharField(max_length=100, blank=True)
    hospital = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def __str__(self):
        return f"Dr. {self.name} ({self.email})"

    class Meta:
        db_table = 'doctors'
        verbose_name = 'Doctor'
        verbose_name_plural = 'Doctors'


# ─────────────────────────────────────────────
#  Patient Model
# ─────────────────────────────────────────────

class Patient(models.Model):
    """Stores registered user/patient information."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile', null=True, blank=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=256)  # Deprecated in favor of user.password
    age = models.IntegerField(null=True, blank=True)
    dob = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    assigned_doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name='patients')
    created_at = models.DateTimeField(auto_now_add=True)

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def __str__(self):
        return f"{self.name} ({self.email})"

    class Meta:
        db_table = 'patients'
        verbose_name = 'Patient'
        verbose_name_plural = 'Patients'


# ─────────────────────────────────────────────
#  Assessment Model
# ─────────────────────────────────────────────

class Assessment(models.Model):
    """Stores each dementia screening assessment result."""

    RISK_CHOICES = [
        ('Low', 'Low Risk'),
        ('Moderate', 'Moderate Risk'),
        ('High', 'High Risk'),
    ]

    ML_CHOICES = [
        ('dementia', 'Dementia Detected'),
        ('normal', 'Normal'),
        ('pending', 'Pending'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='assessments')

    # Cognitive quiz scores
    orientation_score = models.IntegerField(default=0)   # out of 10
    memory_score = models.IntegerField(default=0)        # out of 10
    executive_score = models.IntegerField(default=0)     # out of 10
    total_score = models.IntegerField(default=0)         # out of 30

    # Reaction time
    reaction_time = models.FloatField(default=0.0)

    # Voice biomarkers
    speech_rate = models.FloatField(default=0.0)
    pause_duration = models.FloatField(default=0.0)
    word_count = models.IntegerField(default=0)
    recording_duration = models.FloatField(default=0.0)

    # ML Model results
    ml_prediction = models.CharField(max_length=10, choices=ML_CHOICES, default='pending')
    ml_dementia_probability = models.FloatField(default=0.0)
    ml_normal_probability = models.FloatField(default=0.0)

    # Final combined risk
    risk_level = models.CharField(max_length=10, choices=RISK_CHOICES, default='Low')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Assessment for {self.patient.name} — {self.risk_level} Risk | ML: {self.ml_prediction} ({self.created_at.strftime('%Y-%m-%d')})"

    class Meta:
        db_table = 'assessments'
        verbose_name = 'Assessment'
        verbose_name_plural = 'Assessments'
        ordering = ['-created_at']


# ─────────────────────────────────────────────
#  MOCA Assessment Model
# ─────────────────────────────────────────────

class MOCAAssessment(models.Model):
    """Stores Montreal Cognitive Assessment (MOCA) results — 30 marks total."""

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='moca_assessments')

    visuospatial_score   = models.IntegerField(default=0)
    naming_score         = models.IntegerField(default=0)
    memory_score         = models.IntegerField(default=0)
    attention1_score     = models.IntegerField(default=0)
    attention2_score     = models.IntegerField(default=0)
    attention3_score     = models.IntegerField(default=0)
    language_score       = models.IntegerField(default=0)
    abstraction_score    = models.IntegerField(default=0)
    orientation_score    = models.IntegerField(default=0)
    delayed_recall_score = models.IntegerField(default=0)
    total_moca_score     = models.IntegerField(default=0)
    answers_json         = models.JSONField(default=dict, blank=True)
    created_at           = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"MOCA for {self.patient.name} — {self.total_moca_score}/30 ({self.created_at.strftime('%Y-%m-%d')})"

    class Meta:
        db_table   = 'moca_assessments'
        verbose_name = 'MOCA Assessment'
        verbose_name_plural = 'MOCA Assessments'
        ordering   = ['-created_at']


# ─────────────────────────────────────────────
#  Clinical Plan Model
# ─────────────────────────────────────────────

class ClinicalPlan(models.Model):
    """Stores clinical plans assigned by doctors to patients."""
    PLAN_TYPES = [
        ('exercise', 'Exercise Schedule'),
        ('diet', 'Diet Chart'),
        ('task', 'Clinical Task'),
        ('prescription', 'Doctor Prescription'),
    ]

    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='plans')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='plans')
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES, default='exercise')
    content = models.JSONField(default=dict)
    special_instructions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'clinical_plans'
        verbose_name = 'Clinical Plan'
        verbose_name_plural = 'Clinical Plans'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_plan_type_display()} for {self.patient.name}"


# ─────────────────────────────────────────────
#  Task Completion Model
# ─────────────────────────────────────────────

class TaskCompletion(models.Model):
    """Tracks when a patient completes an assigned clinical task/exercise."""
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='completions')
    plan = models.ForeignKey(ClinicalPlan, on_delete=models.CASCADE, related_name='completions')
    task_id = models.CharField(max_length=100)
    completed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'task_completions'
        verbose_name = 'Task Completion'
        verbose_name_plural = 'Task Completions'
        ordering = ['-completed_at']

    def __str__(self):
        return f"Completion: {self.task_id} by {self.patient.name}"


# ─────────────────────────────────────────────
#  Notification Model
# ─────────────────────────────────────────────

class Notification(models.Model):
    """Tracks notifications sent to patients when clinical plans are assigned."""
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='notifications')
    plan = models.ForeignKey(ClinicalPlan, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=500)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.patient.name}: {self.message[:30]}..."