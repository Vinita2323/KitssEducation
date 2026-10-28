// Consume the existing durable audit journal after business writes commit.
// No delivery failure is allowed to roll back a payment or approval.
export const businessActions = ['registration_submitted', 'registration_reviewed', 'payment_observed_captured', 'fulfillment_applied', 'registration_fee_applied', 'free_book_access', 'free_course_enrolled', 'paid_enrollment_created', 'paid_course_repurchased', 'franchise_reviewed', 'franchise_submitted', 'franchise_document_reviewed', 'franchise_activated', 'franchise_renewed', 'franchise_renewal_reviewed', 'franchise_renewal_reminder', 'franchise_expired', 'refund_requested', 'refund_reviewed', 'result_submit', 'result_approve', 'result_reject', 'staff_invited', 'account_roles_changed', 'account_status_changed'];

export async function businessNotice(event, { connection, User }) {
  const get = async name => /^[a-f0-9]{24}$/i.test(event.subjectId ?? '') ? connection.models[name]?.findById(event.subjectId) : null;
  let record, recipients = [], title, message, category = 'general', link = '/notifications', key = String(event._id);
  const action = event.action;
  if (action.startsWith('registration_') && action !== 'registration_fee_applied') {
    record = await get('RegistrationApplication'); if (!record || record.personalDataDeletedAt) return null;
    const status = action === 'registration_submitted' ? 'submitted' : [...record.history].filter(h => h.at <= event.at).at(-1)?.status;
    if (!['submitted','needs_changes','approved','rejected','activated'].includes(status)) return null;
    recipients = [record.userId]; title = 'Registration update'; message = 'Your registration application status: ' + status.replaceAll('_', ' ') + '. Review the signed-in application for details.';
  } else if (['payment_observed_captured','fulfillment_applied','registration_fee_applied','refund_requested','refund_reviewed'].includes(action)) {
    record = await get('Order'); if (!record || record.status !== 'captured' || !record.capturedPaymentId) return null;
    recipients = [record.userId]; link = '/orders';
    if (action === 'payment_observed_captured') { title = 'Payment verified'; message = 'Payment capture has been verified. Access activation is checked separately.'; key = 'capture:' + record._id; }
    else if (action.startsWith('refund_')) { if (!record.refundRequest) return null; title = 'Refund review update'; message = action === 'refund_requested' ? 'Your refund request is pending review.' : 'Refund request review: ' + record.refundRequest.status + '. Provider refund completion has not been confirmed.'; }
    else { if (record.fulfillment.state !== 'applied') return null; title = 'Access update'; message = record.product.kind === 'book' ? 'Your purchased book access is available, subject to current publication and licensing.' : record.product.kind === 'course_plan' ? 'Your course enrollment is confirmed for the verified access period.' : 'Your registration fee is verified. Business approval and activation remain separate.'; key = 'fulfillment:' + record._id; }
    if (record.simulated) message = 'SIMULATED TEST: ' + message;
  } else if (['free_book_access','free_course_enrolled','paid_enrollment_created','paid_course_repurchased'].includes(action)) {
    // Paid access is announced only by the committed order fulfillment event.
    if (action.startsWith('paid_')) return null;
    record = await get(action === 'free_book_access' ? 'BookEntitlement' : 'Enrollment'); if (!record || record.revokedAt) return null;
    recipients = [record.userId]; category = action === 'free_course_enrolled' ? 'course' : 'general'; title = 'Free access confirmed'; message = 'Your free ' + (action === 'free_book_access' ? 'book access' : 'course enrollment') + ' is confirmed, subject to current eligibility and publication.';
  } else if (action.startsWith('franchise_')) {
    record = await get('FranchiseApplication'); if (!record?.applicantUserId) return null;
    recipients = [record.applicantUserId]; title = 'Franchise review update'; link = '/register?type=franchise&draft=' + record._id; message = record.workflowVersion === 1 ? (action === 'franchise_renewal_reminder' ? 'Your franchise renewal is approaching. Open your application to review the renewal terms.' : action === 'franchise_expired' ? 'Your franchise renewal period has expired. Open your application to review its current status.' : 'Your franchise application status: ' + record.status + '. Affiliation status: ' + record.affiliationState.replaceAll('_', ' ') + '.') : 'Your application review status: ' + record.status + '. Official affiliation remains blocked pending separate policy, agreement and verification approval.';
  } else if (action.startsWith('result_')) {
    record = await get('ResultRecord'); if (!record) return null;
    title = 'Academic result review'; category = 'exam';
    if (action === 'result_submit') { recipients = (await User.find({ roles: 'super_admin', status: 'active' }).select('_id')).map(u => u._id); message = 'A result draft requires main-admin review. Source and privacy gates remain in force.'; }
    else { const submitter = await User.findOne({ publicId: record.source?.importedBy }); recipients = [record.userId, ...(submitter ? [submitter._id] : [])]; message = 'Result revision review: ' + (action === 'result_approve' ? 'approved' : 'rejected') + '. This does not confirm official publication.'; }
  } else if (['staff_invited','account_roles_changed','account_status_changed'].includes(action)) {
    record = await User.findOne({ publicId: event.subjectId }); if (!record) return null;
    recipients = [record._id]; title = 'Account update'; message = action === 'staff_invited' ? 'Your staff invitation was created. Complete the existing private email verification flow.' : 'Your account settings changed. Sign in again if required; your current permissions remain authoritative.';
  }
  if (!title || !recipients.length) return null;
  return { sourceEventId: key, title, message, category, link, audience: { kind: 'users', userIds: [...new Set(recipients.map(String))] }, status: 'published', publishedAt: event.at };
}
