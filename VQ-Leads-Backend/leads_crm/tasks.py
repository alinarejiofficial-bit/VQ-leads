from celery import shared_task
from django.contrib.auth.models import User
from django.db.models import Max, F
from django.utils import timezone
from decimal import Decimal
import logging

from .models import Lead, LeadActivity, Commission

logger = logging.getLogger(__name__)

@shared_task
def assign_lead_round_robin_task(lead_id):
    logger.info(f"Starting async round-robin assignment for Lead ID: {lead_id}")
    try:
        lead = Lead.objects.get(pk=lead_id)
        if lead.owner:
            logger.info(f"Lead {lead_id} already has an owner. Skipping.")
            return f"Lead {lead_id} already assigned."

        # Query all active agents
        agents = User.objects.filter(profile__role='AGENT', is_active=True)
        if not agents.exists():
            logger.warning("No active sales agents found for round-robin assignment.")
            return "No active agents available."

        # Annotate with the timestamp of their last assigned lead
        agents = agents.annotate(last_assigned=Max('leads__created_at'))
        
        # Order by last_assigned ascending (longest since assigned), Nulls First
        selected_agent = agents.order_by(F('last_assigned').asc(nulls_first=True)).first()
        
        if selected_agent:
            lead.owner = selected_agent
            lead.save()
            
            # Log activity
            LeadActivity.objects.create(
                lead=lead,
                user=None,
                activity_type='ASSIGNMENT',
                description=f"Automatically assigned to {selected_agent.username} via background Round Robin routing."
            )
            logger.info(f"Successfully assigned Lead {lead_id} to agent: {selected_agent.username}")
            return f"Assigned to {selected_agent.username}"
            
        return "Assignment failed: No agent selected."
    except Lead.DoesNotExist:
        logger.error(f"Lead with ID {lead_id} not found.")
        return f"Lead {lead_id} not found."
    except Exception as e:
        logger.exception(f"Error executing round-robin task for Lead {lead_id}: {str(e)}")
        raise e


@shared_task
def calculate_commission_task(lead_id):
    logger.info(f"Starting async commission calculation for Lead ID: {lead_id}")
    try:
        lead = Lead.objects.get(pk=lead_id)
        if lead.status != 'WON':
            logger.info(f"Lead {lead_id} is not WON. Skipping commission calculation.")
            return f"Lead {lead_id} not won."

        if not lead.owner:
            logger.warning(f"Lead {lead_id} has no owner. Cannot calculate commission.")
            return "No owner assigned."

        # Check if commission already exists
        if Commission.objects.filter(lead=lead, agent=lead.owner).exists():
            logger.info(f"Commission already calculated for Lead {lead_id}.")
            return "Commission already exists."

        # Commission = Lead Value x Commission Percentage
        # Uses the agent's user-specific rate if set, otherwise the global rate.
        rate = lead.owner.profile.effective_commission_rate
        amount = lead.value * (rate / Decimal('100.0'))
        
        Commission.objects.create(
            lead=lead,
            agent=lead.owner,
            rate=rate,
            amount=amount,
            status='PENDING'
        )
        
        LeadActivity.objects.create(
            lead=lead,
            user=None,
            activity_type='COMMISSION_CALCULATED',
            description=f"Background task: Commission of ${amount:.2f} ({rate}%) calculated for {lead.owner.username}."
        )
        logger.info(f"Successfully calculated commission of ${amount:.2f} for Agent {lead.owner.username}")
        return f"Commission created: ${amount:.2f}"
    except Lead.DoesNotExist:
        logger.error(f"Lead with ID {lead_id} not found.")
        return f"Lead {lead_id} not found."
    except Exception as e:
        logger.exception(f"Error executing commission task for Lead {lead_id}: {str(e)}")
        raise e
