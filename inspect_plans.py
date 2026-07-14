import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare.settings')
django.setup()

from core.models import Patient, ClinicalPlan, Doctor

print("Patients:")
for p in Patient.objects.all():
    print(f"ID: {p.id}, Name: {p.name}, Email: {p.email}")

print("\nDoctors:")
for d in Doctor.objects.all():
    print(f"ID: {d.id}, Name: {d.name}, Email: {d.email}")

print("\nClinical Plans:")
for cp in ClinicalPlan.objects.all():
    print(f"ID: {cp.id}, Patient: {cp.patient.name}, Doctor: {cp.doctor.name}, Type: {cp.plan_type}")
    print(f"Content: {cp.content}")
    print("-" * 20)
