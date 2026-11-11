import { useState, ChangeEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCustomers } from '../lib/api';
import CustomerForm from '../components/CustomerForm';

interface Customer {
  id?: string;
  customer_code?: string;
  initial?: string;
  fullName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CustomerRowProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
}

function CustomerRow({ customer, onEdit }: CustomerRowProps) {
  const date = customer.createdAt || customer.updatedAt;
  return (
    <article
      className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_160px_140px_auto] items-center gap-3 md:gap-4 py-3 px-4 border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <span
        className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand-dark)' }}
      >
        {customer.initial}
      </span>

      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{customer.fullName}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>
          {customer.email}
          <span className="md:hidden"> · {customer.phone || 'No phone'}</span>
        </p>
      </div>

      <p className="text-xs hidden md:block" style={{ color: 'var(--color-text-secondary)' }}>
        {customer.phone || '—'}
      </p>

      <div className="hidden md:block">
        <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
          {customer.customer_code}
        </p>
        {date && (
          <time className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }} dateTime={date}>
            {new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
          </time>
        )}
      </div>

      <button
        onClick={() => onEdit(customer)}
        className="px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer hover:opacity-80"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-surface-alt)' }}
      >
        Edit
      </button>
    </article>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const customersQuery = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () => fetchCustomers(),
  });

  const customers = customersQuery.data ?? [];
  const filtered = search
    ? customers.filter((c: Customer) =>
        [c.fullName, c.email, c.customer_code, c.phone]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(search.toLowerCase().trim()))
      )
    : customers;

  function handleEdit(customer: Customer): void {
    setEditingCustomer(customer);
    setShowForm(true);
  }

  function handleNew(): void {
    setEditingCustomer(null);
    setShowForm(true);
  }

  function handleClose(): void {
    setShowForm(false);
    setEditingCustomer(null);
  }

  return (
    <>
      <title>Customers — NairaFlow</title>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Customers</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Create and manage your Paystack customers
            </p>
          </div>
          {!showForm && (
            <button
              onClick={handleNew}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer"
              style={{ background: 'var(--color-brand)' }}
            >
              + New Customer
            </button>
          )}
        </div>

        {showForm && (
          <CustomerForm
            key={editingCustomer ? editingCustomer.customer_code || editingCustomer.id : 'new'}
            customer={editingCustomer}
            onCancel={handleClose}
            onSaved={handleClose}
          />
        )}

        <section
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          {/* Search bar */}
          <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--color-border)' }}>
            <input
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Search by name, email, code or phone..."
              className="w-full max-w-sm px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)', color: 'var(--color-text)' }}
            />
          </div>

          {/* Customer list */}
          {customersQuery.isPending ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2].map((i: number) => (
                <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: 'var(--color-border)' }} />
              ))}
            </div>
          ) : customersQuery.isError ? (
            <div className="p-6 text-center">
              <p style={{ color: 'var(--color-error)' }}>Failed to load customers</p>
              <button
                onClick={() => customersQuery.refetch()}
                className="mt-2 text-sm underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              {search
                ? `No customers match "${search}".`
                : 'No customers yet. Create your first customer above.'}
            </p>
          ) : (
            <div>
              <p className="px-4 py-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Showing {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
              </p>
              {filtered.map((customer: Customer) => (
                <CustomerRow
                  key={customer.customer_code || customer.id}
                  customer={customer}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
