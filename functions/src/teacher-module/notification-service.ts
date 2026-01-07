import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const db = getFirestore();
const messaging = getMessaging();

/**
 * Send notification when a new help flag is created
 */
export const onHelpFlagCreated = onDocumentCreated('helpFlags/{helpFlagId}', async (event) => {
  try {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('No data associated with the event');
      return;
    }

    const helpFlagData = snapshot.data();
    const helpFlagId = event.params.helpFlagId;

    console.log('🚨 New help flag created:', {
      helpFlagId,
      studentId: helpFlagData.studentId,
      teacherId: helpFlagData.teacherId,
      priority: helpFlagData.priority,
    });

    // Get teacher profile for notification preferences
    const teacherDoc = await db.collection('teacherProfiles').doc(helpFlagData.teacherId).get();
    if (!teacherDoc.exists) {
      console.log('Teacher profile not found:', helpFlagData.teacherId);
      return;
    }

    const teacherData = teacherDoc.data()!;
    
    // Get student name for notification
    const studentDoc = await db.collection('users').doc(helpFlagData.studentId).get();
    const studentName = studentDoc.exists ? studentDoc.data()?.displayName || 'A student' : 'A student';

    // Build notification content
    const notification = {
      title: '🙋‍♂️ Student Help Request',
      body: `${studentName} needs help with ${_getContextDescription(helpFlagData)}`,
      data: {
        type: 'help_flag_created',
        helpFlagId,
        studentId: helpFlagData.studentId,
        priority: helpFlagData.priority || 'medium',
        timestamp: new Date().toISOString(),
      },
    };

    // Send push notification if teacher has FCM token
    if (teacherData.fcmToken) {
      try {
        const message = {
          notification,
          data: notification.data,
          token: teacherData.fcmToken,
          android: {
            priority: (helpFlagData.priority === 'high' || helpFlagData.priority === 'urgent') ? 'high' as const : 'normal' as const,
          },
          apns: {
            payload: {
              aps: {
                badge: await _getUnreadHelpFlagCount(helpFlagData.teacherId),
                sound: helpFlagData.priority === 'high' || helpFlagData.priority === 'urgent' ? 'default' : undefined,
              },
            },
          },
        };

        const response = await messaging.send(message);
        console.log('✅ Push notification sent successfully:', response);
      } catch (error) {
        console.error('❌ Error sending push notification:', error);
      }
    }

    // Create in-app notification record
    await db.collection('teacherNotifications').add({
      teacherId: helpFlagData.teacherId,
      type: 'help_flag_created',
      title: notification.title,
      body: notification.body,
      data: notification.data,
      read: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Send email notification if high priority and teacher has email notifications enabled
    if ((helpFlagData.priority === 'high' || helpFlagData.priority === 'urgent') && 
        teacherData.notificationPreferences?.email?.helpFlags !== false) {
      await _sendEmailNotification(teacherData, studentName, helpFlagData, helpFlagId);
    }

    console.log('✅ Help flag notifications processed successfully');

  } catch (error) {
    console.error('❌ Error processing help flag creation:', error);
  }
});

/**
 * Send notification when a help flag is resolved
 */
export const onHelpFlagResolved = onDocumentUpdated('helpFlags/{helpFlagId}', async (event) => {
  try {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    
    if (!beforeData || !afterData) {
      console.log('No data associated with the event');
      return;
    }

    // Check if status changed from open to resolved
    if (beforeData.status !== 'resolved' && afterData.status === 'resolved') {
      const helpFlagId = event.params.helpFlagId;
      
      console.log('✅ Help flag resolved:', {
        helpFlagId,
        studentId: afterData.studentId,
        teacherId: afterData.teacherId,
        resolvedBy: afterData.resolvedBy,
      });

      // Get student profile for notification
      const studentDoc = await db.collection('users').doc(afterData.studentId).get();
      if (!studentDoc.exists) {
        console.log('Student profile not found:', afterData.studentId);
        return;
      }

      const studentData = studentDoc.data()!;
      
      // Get teacher name
      const teacherDoc = await db.collection('teacherProfiles').doc(afterData.teacherId).get();
      const teacherName = teacherDoc.exists ? 
        `${teacherDoc.data()?.firstName || ''} ${teacherDoc.data()?.lastName || ''}`.trim() || 'Your teacher' 
        : 'Your teacher';

      // Build notification content
      const notification = {
        title: '✅ Help Request Resolved',
        body: `${teacherName} has responded to your help request${afterData.resolutionNotes ? ': ' + afterData.resolutionNotes.substring(0, 50) + '...' : ''}`,
        data: {
          type: 'help_flag_resolved',
          helpFlagId,
          teacherId: afterData.teacherId,
          timestamp: new Date().toISOString(),
        },
      };

      // Send push notification to student if they have FCM token
      if (studentData.fcmToken) {
        try {
          const message = {
            notification,
            data: notification.data,
            token: studentData.fcmToken,
          };

          const response = await messaging.send(message);
          console.log('✅ Help flag resolution notification sent to student:', response);
        } catch (error) {
          console.error('❌ Error sending resolution notification:', error);
        }
      }

      // Create in-app notification record for student
      await db.collection('studentNotifications').add({
        studentId: afterData.studentId,
        type: 'help_flag_resolved',
        title: notification.title,
        body: notification.body,
        data: notification.data,
        read: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      console.log('✅ Help flag resolution notifications processed successfully');
    }

  } catch (error) {
    console.error('❌ Error processing help flag resolution:', error);
  }
});

/**
 * Send notification when assignment is due soon
 */
export const onAssignmentDueSoon = onDocumentUpdated('teacherAssessments/{assessmentId}', async (event) => {
  try {
    const afterData = event.data?.after.data();
    
    if (!afterData || afterData.status !== 'active') {
      return;
    }

    const scheduledFor = afterData.scheduledFor?.toDate();
    if (!scheduledFor) {
      return;
    }

    const now = new Date();
    const timeUntilDue = scheduledFor.getTime() - now.getTime();
    const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);

    // Notify if due within 24 hours
    if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
      console.log('⏰ Assignment due soon:', {
        assessmentId: event.params.assessmentId,
        title: afterData.title,
        hoursUntilDue: Math.round(hoursUntilDue),
      });

      // Notify all assigned students
      if (afterData.assignedStudentIds && afterData.assignedStudentIds.length > 0) {
        const notifications = afterData.assignedStudentIds.map(async (studentId: string) => {
          const studentDoc = await db.collection('users').doc(studentId).get();
          
          if (studentDoc.exists) {
            const studentData = studentDoc.data()!;
            
            const notification = {
              title: '⏰ Assignment Due Soon',
              body: `"${afterData.title}" is due in ${Math.round(hoursUntilDue)} hours`,
              data: {
                type: 'assignment_due_soon',
                assessmentId: event.params.assessmentId,
                hoursUntilDue: Math.round(hoursUntilDue).toString(),
                timestamp: new Date().toISOString(),
              },
            };

            // Send push notification
            if (studentData.fcmToken) {
              try {
                await messaging.send({
                  notification,
                  data: notification.data,
                  token: studentData.fcmToken,
                });
              } catch (error) {
                console.error('❌ Error sending due soon notification:', error);
              }
            }

            // Create in-app notification
            await db.collection('studentNotifications').add({
              studentId,
              type: 'assignment_due_soon',
              title: notification.title,
              body: notification.body,
              data: notification.data,
              read: false,
              createdAt: new Date(),
              expiresAt: scheduledFor, // Expire when assignment is due
            });
          }
        });

        await Promise.all(notifications);
        console.log('✅ Due soon notifications sent to students');
      }
    }

  } catch (error) {
    console.error('❌ Error processing assignment due soon notification:', error);
  }
});

// Helper functions
function _getContextDescription(helpFlagData: any): string {
  switch (helpFlagData.sourceType) {
    case 'assignment':
      return helpFlagData.contextJson?.assignmentTitle || 'an assignment';
    case 'question':
      return 'a question';
    case 'concept_card':
      return helpFlagData.contextJson?.conceptCardTitle || 'a concept';
    default:
      return 'their studies';
  }
}

async function _getUnreadHelpFlagCount(teacherId: string): Promise<number> {
  try {
    const unreadFlags = await db
      .collection('helpFlags')
      .where('teacherId', '==', teacherId)
      .where('status', '==', 'open')
      .get();
    
    return unreadFlags.size;
  } catch (error) {
    console.error('Error getting unread help flag count:', error);
    return 0;
  }
}

async function _sendEmailNotification(teacherData: any, studentName: string, helpFlagData: any, helpFlagId: string) {
  try {
    // This would integrate with an email service like SendGrid, AWS SES, etc.
    // For now, we'll just log the email that would be sent
    
    const emailData = {
      to: teacherData.email,
      subject: `🚨 Urgent: Student Help Request - ${helpFlagData.priority.toUpperCase()} Priority`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">🚨 Urgent Help Request</h2>
          <p><strong>${studentName}</strong> has submitted a ${helpFlagData.priority} priority help request.</p>
          
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
            <p><strong>Student:</strong> ${studentName}</p>
            <p><strong>Priority:</strong> ${helpFlagData.priority.toUpperCase()}</p>
            <p><strong>Context:</strong> ${_getContextDescription(helpFlagData)}</p>
            ${helpFlagData.description ? `<p><strong>Message:</strong> ${helpFlagData.description}</p>` : ''}
          </div>
          
          <p style="margin-top: 20px;">
            Please log into your teacher dashboard to respond to this help request.
          </p>
          
          <a href="https://thebrainspark-project.web.app/teacher/help-flags/${helpFlagId}" 
             style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Help Request
          </a>
        </div>
      `,
    };

    console.log('📧 Email notification would be sent:', emailData);
    
    // TODO: Integrate with actual email service
    // await emailService.send(emailData);
    
  } catch (error) {
    console.error('❌ Error sending email notification:', error);
  }
}