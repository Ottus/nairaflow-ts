import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCustomer, updateCustomer } from '../lib/api';
import { customerCreateSchema, customerUpdateSchema } from '../lib/validators/customerValidator';
import { useToast } from '../contexts/ToastContext';

interface Customer {
  id?: string;
  customer_code?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  fullName?: string;
}

interface CustomerFormProps {
  customer?: Customer | null;
  onCancel?: () => void;
  onSaved?: (customer: Customer) => void;
}

/**
 * CustomerForm — create new customers or edit existing ones via Paystack.
 * @param {Object|null} customer - Customer being edited (null = create mode)
 * @param {Function} onCancel - Close the form
 * @param {Function} onSaved - Called after a successful save
 */
export default function CustomerForm({ customer = null, onCancel, onSaved }: CustomerFormProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEdit = Boolean(customer);
  const customerIdentifier = customer?.customer_code || customer?.id;

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(isEdit ? customerUpdateSchema : customerCreateSchema),
    defaultValues: isEdit
      ? {
          email: customer.email || '',
          firstName: customer.firstName || '',
          lastName: customer.lastName || '',
          phone: customer.phone || '',
        }
      : { email: '', firstName: '', lastName: '', phone: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (!isEdit) return createCustomer(data);
      if (!customerIdentifier) throw new Error('Customer identifier is missing');
      return updateCustomer(customerIdentifier, data);
    },
    onSuccess: (saved: Customer) => {
      toast.success(
        isEdit
          ? `Customer updated: ${saved.fullName || saved.email}`
          : `Customer created: ${saved.fullName || saved.email}`
      );
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (isEdit) queryClient.invalidateQueries({ queryKey: ['customer', customer?.customer_code || customer?.id] });
      onSaved?.(saved);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Saving customer failed. Try again.');
    },
  });

  const fieldStyle = (hasError: boolean) => ({
    borderColor: hasError ? 'var(--color-error)' : 'var(--color-border)',
    background: 'var(--color-surface-alt)',
  });

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className="rounded-xl border p-6 space-y-4"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{isEdit ? 'Edit Customer' : 'New Customer'}</h2>
        {isEdit && customer?.customer_code && (
          <span
            className="text-[11px] px-2 py-0.5 rounded-full border font-semibold"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}
          >
            {customer.customer_code}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="firstName">First Name</label>
          <input
            {...register('firstName')}
            id="firstName"
            placeholder="Ada"
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={fieldStyle(!!errors.firstName)}
          />
          {errors.firstName && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.firstName.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="lastName">Last Name</label>
          <input
            {...register('lastName')}
            id="lastName"
            placeholder="Obi"
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={fieldStyle(!!errors.lastName)}
          />
          {errors.lastName && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.lastName.message as string}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="customerEmail">Email Address</label>
        <input
          {...register('email')}
          id="customerEmail"
          type="email"
          placeholder="ada.obi@email.com"
          className="w-full px-3 py-2 rounded-lg border text-sm"
          style={fieldStyle(!!errors.email)}
        />
        {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.email.message as string}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="phone">Phone (optional)</label>
        <input
          {...register('phone')}
          id="phone"
          type="tel"
          placeholder="08031234567"
          className="w-full px-3 py-2 rounded-lg border text-sm"
          style={fieldStyle(!!errors.phone)}
        />
        {errors.phone && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.phone.message as string}</p>}
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
          style={{ background: 'var(--color-brand)' }}
        >
          {mutation.isPending ? '⏳ Saving...' : isEdit ? 'Save Changes' : 'Create Customer'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={mutation.isPending}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold border cursor-pointer disabled:opacity-50"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-surface-alt)' }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
