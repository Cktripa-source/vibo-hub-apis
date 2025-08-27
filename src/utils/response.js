export const ok = (res, data, message = 'OK') => res.json({ success: true, message, data });
