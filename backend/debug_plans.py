import sys
import os

# Make sure we can find Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare.settings')

import django
django.setup()

from core.models import Patient, ClinicalPlan, Doctor

print("=" * 60)
print("ALL PATIENTS:")
for p in Patient.objects.all():
    doc = p.assigned_doctor
    print(f"  ID={p.id}, Name={p.name}, Email={p.email}, AssignedDoctor={'Dr. ' + doc.name + ' (ID='+str(doc.id)+')' if doc else 'NONE'}")

print("\nALL DOCTORS:")
for d in Doctor.objects.all():
    print(f"  ID={d.id}, Name={d.name}, Email={d.email}")

print("\nALL CLINICAL PLANS:")
plans = ClinicalPlan.objects.all()
if not plans:
    print("  NO CLINICAL PLANS FOUND IN DATABASE!")
else:
    for cp in plans:
        print(f"  PlanID={cp.id}, Type={cp.plan_type}")
        print(f"    Patient: {cp.patient.name} (ID={cp.patient_id})")
        print(f"    Doctor:  {cp.doctor.name}  (ID={cp.doctor_id})")
        print(f"    Content: {cp.content}")
        print(f"    Instructions: {cp.special_instructions[:60] if cp.special_instructions else 'None'}")
        print("-" * 40)

print("=" * 60)
