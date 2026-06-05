import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from leads_crm.models import UserProfile, SalesTeam, LeadForm, Lead, LeadActivity, FollowUp, Task, Commission
from decimal import Decimal
from django.utils import timezone
import datetime

def seed_data():
    print("Clearing old data...")
    Commission.objects.all().delete()
    Task.objects.all().delete()
    FollowUp.objects.all().delete()
    LeadActivity.objects.all().delete()
    Lead.objects.all().delete()
    LeadForm.objects.all().delete()
    SalesTeam.objects.all().delete()
    User.objects.exclude(is_superuser=True).delete()

    # Ensure admin user exists or create it
    print("Creating admin account...")
    admin_user, created = User.objects.get_or_create(username='admin')
    if created or not admin_user.check_password('admin123'):
        admin_user.set_password('admin123')
        admin_user.email = 'admin@vqleads.com'
        admin_user.first_name = 'Sarah'
        admin_user.last_name = 'Conner'
        admin_user.save()
    
    admin_profile = admin_user.profile
    admin_profile.role = 'ADMIN'
    admin_profile.save()

    # Create Sales Agents
    print("Creating sales agent accounts...")
    agent_data = [
        {'username': 'agent1', 'password': 'agent123', 'first': 'Alice', 'last': 'Smith', 'rate': Decimal('8.50')},
        {'username': 'agent2', 'password': 'agent123', 'first': 'Bob', 'last': 'Jones', 'rate': Decimal('12.00')},
        {'username': 'agent3', 'password': 'agent123', 'first': 'Charlie', 'last': 'Brown', 'rate': Decimal('10.00')}
    ]
    
    agents = []
    for data in agent_data:
        agent, created = User.objects.get_or_create(username=data['username'])
        agent.set_password(data['password'])
        agent.email = f"{data['username']}@vqleads.com"
        agent.first_name = data['first']
        agent.last_name = data['last']
        agent.save()
        
        profile = agent.profile
        profile.role = 'AGENT'
        profile.commission_rate = data['rate']
        profile.save()
        agents.append(agent)

    # Create Sales Teams
    print("Creating sales teams...")
    team1 = SalesTeam.objects.create(
        name="Outbound Growth Team",
        description="Responsible for outbound cold outreach and sales development.",
        leader=admin_user
    )
    team1.members.add(agents[0], agents[1])

    team2 = SalesTeam.objects.create(
        name="Enterprise Accounts",
        description="Focused on high-value corporate deals and inbound inquiries.",
        leader=admin_user
    )
    team2.members.add(agents[1], agents[2])

    # Create Lead Forms
    print("Creating lead forms...")
    form_rr = LeadForm.objects.create(
        name="Website Contact Form",
        description="General contact page form on the company website.",
        assignment_mode="ROUND_ROBIN",
        source_name="Website Inbound",
        is_active=True,
        created_by=admin_user
    )

    form_manual = LeadForm.objects.create(
        name="Enterprise Demo Request",
        description="Special form for requesting high-tier enterprise demos.",
        assignment_mode="MANUAL",
        source_name="Ad Campaign",
        is_active=True,
        created_by=admin_user
    )

    # Create Leads with status distributions and historical creation dates
    print("Creating dummy leads...")
    now = timezone.now()
    
    leads_list = [
        # Won Leads (generates commissions)
        {'name': 'Stark Industries', 'email': 'pepper@stark.com', 'phone': '212-555-0199', 'company': 'Stark Industries', 'status': 'WON', 'source': 'Website Inbound', 'value': Decimal('15000.00'), 'owner': agents[0], 'days_ago': 12},
        {'name': 'Wayne Enterprises', 'email': 'bruce@waynecorp.com', 'phone': '312-555-0100', 'company': 'Wayne Enterprises', 'status': 'WON', 'source': 'Direct', 'value': Decimal('45000.00'), 'owner': agents[1], 'days_ago': 8},
        {'name': 'Acme Corp', 'email': 'wile@acme.com', 'phone': '505-555-4929', 'company': 'Acme Corp', 'status': 'WON', 'source': 'Ad Campaign', 'value': Decimal('8500.00'), 'owner': agents[2], 'days_ago': 5},
        
        # In Progress Leads
        {'name': 'LexCorp', 'email': 'lex@lexcorp.com', 'phone': '202-555-0143', 'company': 'LexCorp', 'status': 'IN_PROGRESS', 'source': 'Website Inbound', 'value': Decimal('22000.00'), 'owner': agents[0], 'days_ago': 4},
        {'name': 'Oscorp Technologies', 'email': 'norman@oscorp.com', 'phone': '718-555-0177', 'company': 'Oscorp Technologies', 'status': 'IN_PROGRESS', 'source': 'Direct', 'value': Decimal('18000.00'), 'owner': agents[1], 'days_ago': 6},
        {'name': 'Umbrella Corporation', 'email': 'albert@umbrella.com', 'phone': '206-555-0182', 'company': 'Umbrella Corp', 'status': 'IN_PROGRESS', 'source': 'Ad Campaign', 'value': Decimal('32000.00'), 'owner': agents[2], 'days_ago': 3},

        # Qualified Leads
        {'name': 'Cyberdyne Systems', 'email': 'miles@cyberdyne.com', 'phone': '408-555-0112', 'company': 'Cyberdyne Systems', 'status': 'QUALIFIED', 'source': 'Website Inbound', 'value': Decimal('12500.00'), 'owner': agents[0], 'days_ago': 1},
        {'name': 'Hooli Inc', 'email': 'gavin@hooli.xyz', 'phone': '650-555-0165', 'company': 'Hooli Inc', 'status': 'QUALIFIED', 'source': 'Direct', 'value': Decimal('27500.00'), 'owner': agents[1], 'days_ago': 2},

        # Contacted Leads
        {'name': 'Initech', 'email': 'peter@initech.com', 'phone': '512-555-0154', 'company': 'Initech', 'status': 'CONTACTED', 'source': 'Website Inbound', 'value': Decimal('6000.00'), 'owner': agents[0], 'days_ago': 7},
        {'name': 'Tyrell Corporation', 'email': 'eldon@tyrell.com', 'phone': '213-555-0128', 'company': 'Tyrell Corporation', 'status': 'CONTACTED', 'source': 'Direct', 'value': Decimal('50000.00'), 'owner': agents[2], 'days_ago': 10},

        # Lost Leads
        {'name': 'Soylent Industries', 'email': 'thorn@soylent.com', 'phone': '212-555-0160', 'company': 'Soylent Green', 'status': 'LOST', 'source': 'Ad Campaign', 'value': Decimal('4500.00'), 'owner': agents[1], 'days_ago': 14},

        # New / Unassigned Leads
        {'name': 'Dunder Mifflin', 'email': 'michael@dundermifflin.com', 'phone': '570-555-0124', 'company': 'Dunder Mifflin Paper Co', 'status': 'NEW', 'source': 'Website Inbound', 'value': Decimal('3500.00'), 'owner': None, 'days_ago': 0},
        {'name': 'Globex Corporation', 'email': 'hank@globex.com', 'phone': '541-555-0111', 'company': 'Globex Corp', 'status': 'NEW', 'source': 'Ad Campaign', 'value': Decimal('60000.00'), 'owner': None, 'days_ago': 1},
    ]

    leads = []
    for ldata in leads_list:
        created_time = now - datetime.timedelta(days=ldata['days_ago'])
        lead = Lead.objects.create(
            name=ldata['name'],
            email=ldata['email'],
            phone=ldata['phone'],
            company=ldata['company'],
            status=ldata['status'],
            source=ldata['source'],
            value=ldata['value'],
            owner=ldata['owner'],
            form=form_rr if ldata['source'] == 'Website Inbound' else None
        )
        
        # Override created_at/updated_at default django auto_now fields via queryset update to simulate historical data
        Lead.objects.filter(pk=lead.pk).update(created_at=created_time, updated_at=created_time)
        lead.refresh_from_db()
        leads.append(lead)

        # Activity Logs
        LeadActivity.objects.create(
            lead=lead,
            user=admin_user,
            activity_type='CREATED',
            description=f"Lead added to database via {ldata['source']}.",
            created_at=created_time
        )

        if ldata['owner']:
            LeadActivity.objects.create(
                lead=lead,
                user=admin_user,
                activity_type='ASSIGNMENT',
                description=f"Assigned to {ldata['owner'].username}.",
                created_at=created_time + datetime.timedelta(minutes=30)
            )

        if ldata['status'] != 'NEW' and ldata['owner']:
            LeadActivity.objects.create(
                lead=lead,
                user=ldata['owner'],
                activity_type='STATUS_CHANGE',
                description=f"Status advanced to {ldata['status']}.",
                created_at=created_time + datetime.timedelta(hours=2)
            )

        # Trigger Commissions manually for WON leads since we bypassed serializers/save overrides
        if ldata['status'] == 'WON' and ldata['owner']:
            rate = ldata['owner'].profile.commission_rate
            amount = ldata['value'] * (rate / Decimal('100.0'))
            
            # Random status for demo commissions
            comm_status = 'PENDING'
            if ldata['days_ago'] > 10:
                comm_status = 'PAID'
            elif ldata['days_ago'] > 6:
                comm_status = 'APPROVED'
                
            Commission.objects.create(
                lead=lead,
                agent=ldata['owner'],
                rate=rate,
                amount=amount,
                status=comm_status,
                calculated_at=created_time + datetime.timedelta(hours=2),
                approved_at=created_time + datetime.timedelta(days=1) if comm_status in ['APPROVED', 'PAID'] else None,
                approved_by=admin_user if comm_status in ['APPROVED', 'PAID'] else None
            )

    # Add FollowUps
    print("Scheduling follow-ups...")
    followup_data = [
        {'lead': leads[3], 'notes': 'Call to detail pricing models and feature list.', 'days_offset': 1, 'by': agents[0]},  # LexCorp
        {'lead': leads[4], 'notes': 'Follow up on Norman regarding their NDA review.', 'days_offset': 2, 'by': agents[1]},   # Oscorp
        {'lead': leads[5], 'notes': 'Discuss pilot project with Umbrella team.', 'days_offset': -1, 'completed': True, 'by': agents[2]} # Umbrella
    ]
    for fdata in followup_data:
        FollowUp.objects.create(
            lead=fdata['lead'],
            scheduled_time=now + datetime.timedelta(days=fdata['days_offset']),
            notes=fdata['notes'],
            completed=fdata.get('completed', False),
            created_by=fdata['by']
        )

    # Add Tasks
    print("Assigning checklist tasks...")
    tasks_list = [
        {'lead': leads[3], 'title': 'Send product deck and case study', 'due': now + datetime.timedelta(days=1), 'assigned': agents[0], 'status': 'PENDING'},
        {'lead': leads[3], 'title': 'Schedule technical scoping meeting', 'due': now + datetime.timedelta(days=3), 'assigned': agents[0], 'status': 'PENDING'},
        {'lead': leads[4], 'title': 'Submit proposal for Review board', 'due': now + datetime.timedelta(days=2), 'assigned': agents[1], 'status': 'PENDING'},
        {'lead': leads[5], 'title': 'Initial discovery call', 'due': now - datetime.timedelta(days=2), 'assigned': agents[2], 'status': 'COMPLETED'},
    ]
    for tdata in tasks_list:
        Task.objects.create(
            lead=tdata['lead'],
            title=tdata['title'],
            due_date=tdata['due'],
            assigned_to=tdata['assigned'],
            status=tdata['status'],
            created_by=admin_user
        )

    print("\nDatabase seeded successfully!")
    print("-" * 30)
    print("Admin: username='admin', password='admin123'")
    print("Agent 1: username='agent1', password='agent123'")
    print("Agent 2: username='agent2', password='agent123'")
    print("Agent 3: username='agent3', password='agent123'")
    print("-" * 30)

if __name__ == '__main__':
    seed_data()
