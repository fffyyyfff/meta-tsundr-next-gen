import { prisma } from '../../lib/prisma';

export type NotificationEvent =
  | 'agent.completed'
  | 'agent.failed'
  | 'workflow.completed';

export interface NotificationPayload {
  userId: string;
  event: NotificationEvent;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailNotification {
  to: EmailRecipient;
  subject: string;
  body: string;
}

// Email provider interface — implement with a real provider (SendGrid, SES, etc.)
export interface EmailProvider {
  send(notification: EmailNotification): Promise<void>;
}

class NotificationService {
  private emailProvider: EmailProvider | null = null;

  setEmailProvider(provider: EmailProvider): void {
    this.emailProvider = provider;
  }

  async notify(payload: NotificationPayload): Promise<void> {
    // Persist notification
    await prisma.notification.create({
      data: {
        userId: payload.userId,
        event: payload.event,
        title: payload.title,
        message: payload.message,
        metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
      },
    });

    // Send Slack webhook if configured
    await this.sendSlackWebhook(payload);
  }

  async notifyAgentCompleted(
    userId: string,
    agentType: string,
    task: string,
    duration: number,
  ): Promise<void> {
    await this.notify({
      userId,
      event: 'agent.completed',
      title: `${agentType} completed`,
      message: `Task "${task}" finished in ${duration}ms`,
      metadata: { agentType, duration },
    });
  }

  async notifyAgentFailed(
    userId: string,
    agentType: string,
    task: string,
    error: string,
  ): Promise<void> {
    await this.notify({
      userId,
      event: 'agent.failed',
      title: `${agentType} failed`,
      message: `Task "${task}" failed: ${error}`,
      metadata: { agentType, error },
    });
  }

  async notifyWorkflowCompleted(
    userId: string,
    workflowName: string,
    stepsCompleted: number,
  ): Promise<void> {
    await this.notify({
      userId,
      event: 'workflow.completed',
      title: `Workflow "${workflowName}" completed`,
      message: `All ${stepsCompleted} steps finished successfully`,
      metadata: { workflowName, stepsCompleted },
    });
  }

  async sendEmail(notification: EmailNotification): Promise<void> {
    if (!this.emailProvider) {
      console.warn('[notification] Email provider not configured, skipping email');
      return;
    }
    await this.emailProvider.send(notification);
  }

  private async sendSlackWebhook(payload: NotificationPayload): Promise<void> {
    const config = await prisma.webhookConfig.findUnique({
      where: { userId: payload.userId },
    });

    if (!config?.enabled || !config.slackUrl) return;

    const enabledEvents = config.events.split(',');
    if (!enabledEvents.includes(payload.event)) return;

    const emoji =
      payload.event === 'agent.failed' ? ':x:' : ':white_check_mark:';

    try {
      const response = await fetch(config.slackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${emoji} *${payload.title}*\n${payload.message}`,
        }),
      });

      if (!response.ok) {
        console.error(
          `[notification] Slack webhook failed: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error('[notification] Slack webhook error:', error);
    }
  }
}

export const notificationService = new NotificationService();
