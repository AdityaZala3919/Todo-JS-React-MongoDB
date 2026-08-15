/**
 * Validation — Form and data validation helpers
 */
export function validateEmail(email) {
  if (!email || !email.trim()) return { valid: false, error: 'Email is required' };
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email.trim())) return { valid: false, error: 'Invalid email format' };
  return { valid: true };
}

export function validatePassword(password) {
  if (!password) return { valid: false, error: 'Password is required' };
  if (password.length < 6) return { valid: false, error: 'Password must be at least 6 characters' };
  return { valid: true };
}

export function validateTask(data) {
  const errors = {};
  if (!data.title || !data.title.trim()) errors.title = 'Title is required';
  else if (data.title.trim().length > 200) errors.title = 'Title must be under 200 characters';
  if (!data.task_type || !['one_time', 'recurring'].includes(data.task_type)) errors.task_type = 'Invalid task type';
  if (!data.priority || !['low', 'medium', 'high', 'urgent'].includes(data.priority)) errors.priority = 'Invalid priority';
  if (data.estimated_duration !== undefined && data.estimated_duration !== null) {
    const dur = Number(data.estimated_duration);
    if (isNaN(dur) || dur < 0) errors.estimated_duration = 'Duration must be a positive number';
  }
  if (data.task_type === 'recurring') {
    if (!data.frequency || !['daily', 'weekly', 'selected_days'].includes(data.frequency)) errors.frequency = 'Recurrence frequency is required';
    if (data.frequency === 'selected_days' && (!data.days_of_week || data.days_of_week.length === 0)) errors.days_of_week = 'Select at least one day';
    if (data.min_duration !== undefined && data.min_duration !== null) {
      const dur = Number(data.min_duration);
      if (isNaN(dur) || dur <= 0) errors.min_duration = 'Minimum duration must be a positive number';
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateImportData(data) {
  if (!data || typeof data !== 'object') return { valid: false, error: 'Invalid data format' };
  if (!data.schema_version || typeof data.schema_version !== 'number') return { valid: false, error: 'Missing or invalid schema version' };
  if (!data.data || typeof data.data !== 'object') return { valid: false, error: 'Missing data payload' };
  return { valid: true };
}

export function validateProjectName(name) {
  if (!name || !name.trim()) return { valid: false, error: 'Project name is required' };
  if (name.trim().length > 50) return { valid: false, error: 'Name must be under 50 characters' };
  return { valid: true };
}

export function validateTagName(name) {
  if (!name || !name.trim()) return { valid: false, error: 'Tag name is required' };
  if (name.trim().length > 30) return { valid: false, error: 'Tag name must be under 30 characters' };
  return { valid: true };
}
