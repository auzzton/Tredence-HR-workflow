import { useId } from 'react'
import type {
  InputHTMLAttributes,
  Ref,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

/**
 * Tiny field primitives shared by every per-type form. Each forwards the
 * underlying element's ref + native props so RHF's `{...register('name')}`
 * spread works directly. React 19 passes `ref` as a plain prop for
 * function components — no forwardRef wrapper needed.
 *
 * `error` renders in danger color below the control when present. These
 * components only display the error; evaluation happens in the zod
 * resolver wired by the parent form.
 */

const inputClass =
  'rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]'

const errorInputClass =
  'rounded-md border border-[var(--color-danger)] bg-[var(--color-surface-raised)] px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-danger)]'

const labelClass = 'text-xs font-medium text-[var(--color-text-secondary)]'
const errorClass = 'text-xs text-[var(--color-danger)]'

type FieldCommon = {
  label: string
  error?: string | undefined
}

export type TextFieldProps = FieldCommon &
  InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }

export function TextField({ label, error, id, ref, className, ...rest }: TextFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className={labelClass}>
        {label}
      </label>
      <input
        id={fieldId}
        ref={ref}
        className={className ?? (error ? errorInputClass : inputClass)}
        {...rest}
      />
      {error ? <span className={errorClass}>{error}</span> : null}
    </div>
  )
}

export type TextAreaFieldProps = FieldCommon &
  TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }

export function TextAreaField({
  label,
  error,
  id,
  ref,
  rows = 3,
  ...rest
}: TextAreaFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className={labelClass}>
        {label}
      </label>
      <textarea
        id={fieldId}
        ref={ref}
        rows={rows}
        className={error ? errorInputClass : inputClass}
        {...rest}
      />
      {error ? <span className={errorClass}>{error}</span> : null}
    </div>
  )
}

export type SelectOption = { value: string; label: string }

export type SelectFieldProps = FieldCommon &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
    options: readonly SelectOption[]
    placeholder?: string
    ref?: Ref<HTMLSelectElement>
  }

export function SelectField({
  label,
  error,
  id,
  ref,
  options,
  placeholder,
  ...rest
}: SelectFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className={labelClass}>
        {label}
      </label>
      <select
        id={fieldId}
        ref={ref}
        className={error ? errorInputClass : inputClass}
        {...rest}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? <span className={errorClass}>{error}</span> : null}
    </div>
  )
}

export type NumberFieldProps = FieldCommon &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { ref?: Ref<HTMLInputElement> }

export function NumberField(props: NumberFieldProps) {
  return <TextField {...props} type="number" inputMode="decimal" />
}

export type CheckboxFieldProps = FieldCommon &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { ref?: Ref<HTMLInputElement> }

export function CheckboxField({ label, error, id, ref, ...rest }: CheckboxFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
        <input
          id={fieldId}
          ref={ref}
          type="checkbox"
          className="h-4 w-4 rounded border-[var(--color-border-strong)] text-[var(--color-accent)]"
          {...rest}
        />
        {label}
      </label>
      {error ? <span className={errorClass}>{error}</span> : null}
    </div>
  )
}
