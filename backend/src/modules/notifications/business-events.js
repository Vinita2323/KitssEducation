// Consume the existing durable audit journal after business writes commit.
// No delivery failure is allowed to roll back a payment or approval.
export const businessActions = [
  'registration_submitted', 'registration_reviewed',
  'admission_submitted', 'admission_reviewed',
  'payment_observed_captured', 'fulfillment_applied', 'registration_fee_applied',
  'free_book_access', 'free_course_enrolled', 'paid_enrollment_created', 'paid_course_repurchased',
  'franchise_reviewed', 'franchise_submitted', 'franchise_document_reviewed',
  'franchise_activated', 'franchise_renewed', 'franchise_renewal_reviewed',
  'franchise_renewal_reminder', 'franchise_expired',
  'refund_requested', 'refund_reviewed',
  'result_submit', 'result_approve', 'result_reject', 'result_publish',
  'staff_invited', 'account_roles_changed', 'account_status_changed'
];

export async function businessNotice(event, { connection, User }) {
  const get = async name => /^[a-f0-9]{24}$/i.test(event.subjectId ?? '') ? connection.models[name]?.findById(event.subjectId) : null;
  const adminIds = async () => (await User.find({ roles: { $in: ['super_admin', 'staff'] }, status: 'active' }).select('_id')).map(u => String(u._id));
  let record, recipients = [], title, message, category = 'general', link = '/notifications', key = String(event._id);
  const action = event.action;

  if (action.startsWith('registration_') && action !== 'registration_fee_applied') {
    record = await get('RegistrationApplication'); if (!record || record.personalDataDeletedAt) return null;
    const status = action === 'registration_submitted' ? 'submitted' : [...record.history].filter(h => h.at <= event.at).at(-1)?.status;
    if (!['submitted','needs_changes','approved','rejected','activated'].includes(status)) return null;
    const studentNotice = {
      sourceEventId: key,
      title: 'Registration update',
      message: 'Your registration application status: ' + status.replaceAll('_', ' ') + '. Review the signed-in application for details.',
      category: 'general',
      link: '/notifications',
      audience: { kind: 'users', userIds: [String(record.userId)] },
      status: 'published',
      publishedAt: event.at
    };
    if (action === 'registration_submitted') {
      const admins = await adminIds();
      if (admins.length) {
        const adminNotice = {
          sourceEventId: key + ':admin',
          title: 'New Registration Submitted',
          message: `Registration application received: ${record.reference || 'Student'} (${record.kind ? record.kind[0].toUpperCase() + record.kind.slice(1) : 'Application'}). Click to review.`,
          category: 'general',
          link: '/admin/registrations',
          audience: { kind: 'users', userIds: admins },
          status: 'published',
          publishedAt: event.at
        };
        return [studentNotice, adminNotice];
      }
    }
    return studentNotice;
  } else if (action.startsWith('admission_')) {
    record = await get('AdmissionApplication'); if (!record) return null;
    const studentNotice = {
      sourceEventId: key,
      title: 'Admission application update',
      message: `Your college admission application status: ${record.status || 'submitted'} (${record.programSnapshot?.name || 'Program'} at ${record.programSnapshot?.collegeName || 'College'}).`,
      category: 'general',
      link: '/applications',
      audience: { kind: 'users', userIds: [String(record.userId)] },
      status: 'published',
      publishedAt: event.at
    };
    if (action === 'admission_submitted') {
      const admins = await adminIds();
      if (admins.length) {
        const adminNotice = {
          sourceEventId: key + ':admin',
          title: 'New College Admission Application',
          message: `College admission application received: ${record.reference || 'Student'} for ${record.programSnapshot?.name || 'Program'} (${record.programSnapshot?.collegeName || 'College'}). Click to review.`,
          category: 'general',
          link: '/admin/applications',
          audience: { kind: 'users', userIds: admins },
          status: 'published',
          publishedAt: event.at
        };
        return [studentNotice, adminNotice];
      }
    }
    return studentNotice;
  } else if (['payment_observed_captured','fulfillment_applied','registration_fee_applied','refund_requested','refund_reviewed'].includes(action)) {
    record = await get('Order'); if (!record || record.status !== 'captured' || !record.capturedPaymentId) return null;
    recipients = [record.userId]; link = '/orders';
    if (action === 'payment_observed_captured') {
      title = 'Payment verified'; message = 'Payment capture has been verified. Access activation is checked separately.'; key = 'capture:' + record._id;
      const admins = await adminIds();
      const amountStr = record.totalMinor ? ` (INR ${(record.totalMinor / 100).toFixed(2)})` : '';
      const customerNotice = { sourceEventId: key, title, message: record.simulated ? 'SIMULATED TEST: ' + message : message, category, link, audience: { kind: 'users', userIds: [String(record.userId)] }, status: 'published', publishedAt: event.at };
      if (admins.length) {
        const adminNotice = {
          sourceEventId: key + ':admin',
          title: 'Payment Received',
          message: `Payment verified for Order ${record.invoiceNumber || record._id}${amountStr}. Product: ${record.product?.title || record.product?.kind || 'Item'}.`,
          category: 'general',
          link: '/admin/orders',
          audience: { kind: 'users', userIds: admins },
          status: 'published',
          publishedAt: event.at
        };
        return [customerNotice, adminNotice];
      }
      return customerNotice;
    }
    else if (action.startsWith('refund_')) {
      if (!record.refundRequest) return null;
      title = 'Refund review update';
      message = action === 'refund_requested' ? 'Your refund request is pending review.' : 'Refund request review: ' + record.refundRequest.status + '. Provider refund completion has not been confirmed.';
      const customerNotice = {
        sourceEventId: key,
        title,
        message,
        category: 'general',
        link,
        audience: { kind: 'users', userIds: [String(record.userId)] },
        status: 'published',
        publishedAt: event.at
      };
      if (action === 'refund_requested') {
        const admins = await adminIds();
        if (admins.length) {
          const adminNotice = {
            sourceEventId: key + ':admin',
            title: 'New Refund Request',
            message: `Refund requested for order ${record.invoiceNumber || record._id}. Click to review request.`,
            category: 'general',
            link: '/admin/orders',
            audience: { kind: 'users', userIds: admins },
            status: 'published',
            publishedAt: event.at
          };
          return [customerNotice, adminNotice];
        }
      }
      return customerNotice;
    }
    else { if (record.fulfillment.state !== 'applied') return null; title = 'Access update'; message = record.product.kind === 'book' ? 'Your purchased book access is available, subject to current publication and licensing.' : record.product.kind === 'course_plan' ? 'Your course enrollment is confirmed for the verified access period.' : 'Your registration fee is verified. Business approval and activation remain separate.'; key = 'fulfillment:' + record._id; }
    if (record.simulated) message = 'SIMULATED TEST: ' + message;
  } else if (['free_book_access','free_course_enrolled','paid_enrollment_created','paid_course_repurchased'].includes(action)) {
    // Paid access is announced only by the committed order fulfillment event.
    if (action.startsWith('paid_')) return null;
    record = await get(action === 'free_book_access' ? 'BookEntitlement' : 'Enrollment'); if (!record || record.revokedAt) return null;
    recipients = [record.userId]; category = action === 'free_course_enrolled' ? 'course' : 'general'; title = 'Free access confirmed'; message = 'Your free ' + (action === 'free_book_access' ? 'book access' : 'course enrollment') + ' is confirmed, subject to current eligibility and publication.';
  } else if (action.startsWith('franchise_')) {
    record = await get('FranchiseApplication'); if (!record?.applicantUserId) return null;
    const applicantNotice = {
      sourceEventId: key,
      title: 'Franchise review update',
      link: '/register?type=franchise&draft=' + record._id,
      message: record.workflowVersion === 1 ? (action === 'franchise_renewal_reminder' ? 'Your franchise renewal is approaching. Open your application to review the renewal terms.' : action === 'franchise_expired' ? 'Your franchise renewal period has expired. Open your application to review its current status.' : 'Your franchise application status: ' + record.status + '. Affiliation status: ' + record.affiliationState.replaceAll('_', ' ') + '.') : 'Your application review status: ' + record.status + '. Official affiliation remains blocked pending separate policy, agreement and verification approval.',
      category: 'general',
      audience: { kind: 'users', userIds: [String(record.applicantUserId)] },
      status: 'published',
      publishedAt: event.at
    };
    if (action === 'franchise_submitted') {
      const admins = await adminIds();
      if (admins.length) {
        const adminNotice = {
          sourceEventId: key + ':admin',
          title: 'New Franchise Application',
          message: `Franchise application submitted: ${record.institution?.name || record.reference}. Click to review details and credentials.`,
          category: 'general',
          link: '/admin/franchise-requests',
          audience: { kind: 'users', userIds: admins },
          status: 'published',
          publishedAt: event.at
        };
        return [applicantNotice, adminNotice];
      }
    }
    return applicantNotice;
  } else if (action.startsWith('result_')) {
    record = await get('ResultRecord'); if (!record) return null;
    title = 'Academic result review'; category = 'exam';
    if (action === 'result_submit') {
      recipients = (await User.find({ roles: 'super_admin', status: 'active' }).select('_id')).map(u => u._id);
      return {
        sourceEventId: key,
        title,
        message: `A result draft (${record.student?.name || record.rollNormalized}) requires main-admin review. Source and privacy gates remain in force.`,
        category,
        link: '/admin/results',
        audience: { kind: 'users', userIds: [...new Set(recipients.map(String))] },
        status: 'published',
        publishedAt: event.at
      };
    }
    if (action === 'result_publish') {
      const exam = await connection.models.Exam?.findById(record.examId).select('title').lean();
      return {
        sourceEventId: key,
        title: 'Result published',
        message: `Your result${exam?.title ? ' for ' + exam.title : ''} (${record.rollNormalized}) is now published. Open Examination Results to view your marksheet.`,
        category,
        link: '/results',
        audience: { kind: 'users', userIds: [String(record.userId)] },
        status: 'published',
        publishedAt: event.at
      };
    }
    else { const submitter = await User.findOne({ publicId: record.source?.importedBy }); recipients = [record.userId, ...(submitter ? [submitter._id] : [])]; message = 'Result revision review: ' + (action === 'result_approve' ? 'approved' : 'rejected') + '. This does not confirm official publication.'; }
  } else if (['staff_invited','account_roles_changed','account_status_changed'].includes(action)) {
    record = await User.findOne({ publicId: event.subjectId }); if (!record) return null;
    recipients = [record._id]; title = 'Account update'; message = action === 'staff_invited' ? 'Your staff invitation was created. Complete the existing private email verification flow.' : 'Your account settings changed. Sign in again if required; your current permissions remain authoritative.';
  }
  if (!title || !recipients.length) return null;
  return { sourceEventId: key, title, message, category, link, audience: { kind: 'users', userIds: [...new Set(recipients.map(String))] }, status: 'published', publishedAt: event.at };
}
