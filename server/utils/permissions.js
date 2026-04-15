// Centralized permission helpers for documents.
// Permission model (global per-document):
//   permissions.canView       - shared users may view (default true)
//   permissions.canDownload   - shared users may download (default true)
//   permissions.canEdit       - shared users may edit (default false)
//   permissions.preventScreenshot - UI policy flag (returned to client)
//   permissions.watermark         - UI policy flag (returned to client)
//
// Owners and Admins always bypass these toggles.
// Anyone else needs `accessLevel === 'public'` OR membership in `sharedWith`,
// and the relevant boolean must not be explicitly false.

const eqId = (a, b) => String(a) === String(b);

const getRoles = (document, user) => {
    const userIdStr = String(user?.id ?? '');
    const isAdmin = user?.role === 'Admin';
    const isOwner = !!document.uploadedBy && eqId(document.uploadedBy, userIdStr);
    const isShared = (document.sharedWith || []).some(u => eqId(u, userIdStr));
    const isPublic = document.accessLevel === 'public';
    return { isAdmin, isOwner, isShared, isPublic };
};

// Returns { allowed: boolean, reason?: string, status?: number }
//
// Rule: Admin always bypasses (so nobody gets permanently locked out).
// Everyone else — including the document owner — respects the per-document
// permission toggles. This makes the admin/owner toggles real controls
// instead of decorative flags.
const checkAccess = (document, user, action) => {
    if (!document) return { allowed: false, status: 404, reason: 'Document not found' };
    const { isAdmin, isOwner, isShared, isPublic } = getRoles(document, user);

    // Admin always allowed (escape hatch).
    if (isAdmin) return { allowed: true };

    // Access gate: must be owner, shared, or doc is public.
    if (!isOwner && !isShared && !isPublic) {
        return { allowed: false, status: 403, reason: 'Not authorized to access this document' };
    }

    const perms = document.permissions || {};

    if (action === 'view') {
        if (perms.canView === false) {
            return { allowed: false, status: 403, reason: 'View access is restricted for this document' };
        }
        return { allowed: true };
    }

    if (action === 'download') {
        if (perms.canDownload === false) {
            return { allowed: false, status: 403, reason: 'Download access is restricted for this document' };
        }
        return { allowed: true };
    }

    if (action === 'edit') {
        // Public-only users (no ownership, no share) cannot edit.
        if (!isOwner && !isShared) {
            return { allowed: false, status: 403, reason: 'Editing requires explicit share access' };
        }
        if (perms.canEdit !== true) {
            return { allowed: false, status: 403, reason: 'Edit access is restricted for this document' };
        }
        return { allowed: true };
    }

    return { allowed: false, status: 403, reason: 'Unknown action' };
};

const requireOwnerOrAdmin = (document, user) => {
    if (!document) return { allowed: false, status: 404, reason: 'Document not found' };
    const { isOwner, isAdmin } = getRoles(document, user);
    if (isOwner || isAdmin) return { allowed: true };
    return { allowed: false, status: 403, reason: 'Only the owner or an admin can perform this action' };
};

module.exports = { checkAccess, requireOwnerOrAdmin, getRoles, eqId };
