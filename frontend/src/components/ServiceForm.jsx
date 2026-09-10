import React, { useState } from 'react'
import { Upload, Check, Loader2 } from 'lucide-react'
import { submitServiceRecord } from '../api.js'
import './ServiceForm.css'

const SERVICE_TYPES = [
  { value: '', label: 'Select service type' },
  { value: 'routine', label: 'Routine maintenance' },
  { value: 'panel', label: 'Panel / body repair' },
  { value: 'engine', label: 'Engine / transmission' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'other', label: 'Other' },
]

function UploadField({ label, required, file, onChange }) {
  const id = 'upload-' + label.replace(/\s/g, '-')
  return (
    <div className="field">
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      <label htmlFor={id} className={'upload-field' + (file ? ' upload-field--filled' : '')}>
        {file ? (
          <>
            <Check size={18} className="pop" />
            <span className="upload-field-name">{file.name}</span>
          </>
        ) : (
          <>
            <Upload size={18} />
            <span>Upload photo</span>
          </>
        )}
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        className="upload-input"
        onChange={(e) => {
          const f = e.target.files && e.target.files[0]
          onChange(f || null)
        }}
      />
    </div>
  )
}

export default function ServiceForm({ onSubmitted }) {
  const [vin, setVin] = useState('')
  const [odometer, setOdometer] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [cost, setCost] = useState('')
  const [insurance, setInsurance] = useState('no')
  const [notes, setNotes] = useState('')
  const [invoicePhoto, setInvoicePhoto] = useState(null)
  const [beforePhoto, setBeforePhoto] = useState(null)
  const [afterPhoto, setAfterPhoto] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const needsPhotos = serviceType !== '' && serviceType !== 'routine'

  const submit = async (e) => {
    e.preventDefault()
    if (!vin.trim() || !invoicePhoto || submitting) return
    setError('')
    setSubmitting(true)
    try {
      await submitServiceRecord({
        vin: vin.trim(),
        odometer,
        serviceType,
        cost,
        insurance,
        notes,
        invoice: invoicePhoto,
        before_photo: beforePhoto,
        after_photo: afterPhoto,
      })
      onSubmitted(vin.trim())
    } catch (err) {
      setError('Could not submit this record. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="service-form" onSubmit={submit}>
      <div className="field">
        <label>VIN <span className="required">*</span></label>
        <input
          className="input"
          value={vin}
          onChange={(e) => setVin(e.target.value.toUpperCase())}
          maxLength={17}
          placeholder="e.g. WBA3A5C50DF123456"
          required
        />
      </div>

      <div className="service-grid">
        <div className="field">
          <label>Odometer reading (km) <span className="required">*</span></label>
          <input
            className="input"
            type="number"
            min="0"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            placeholder="0"
            required
          />
        </div>
        <div className="field">
          <label>Repair cost (EGP) <span className="required">*</span></label>
          <input
            className="input"
            type="number"
            min="0"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0"
            required
          />
        </div>
      </div>

      <div className="service-grid">
        <div className="field">
          <label>Service type <span className="required">*</span></label>
          <select className="input" value={serviceType} onChange={(e) => setServiceType(e.target.value)} required>
            {SERVICE_TYPES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Insurance claim linked?</label>
          <select className="input" value={insurance} onChange={(e) => setInsurance(e.target.value)}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label>Notes for the record</label>
        <textarea
          className="input service-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything the next owner should know"
        />
      </div>

      <UploadField label="Invoice Photo" required file={invoicePhoto} onChange={setInvoicePhoto} />

      <div
        className={'service-grid--photos' + (needsPhotos ? ' service-grid--photos-visible' : '')}
      >
        <UploadField label="Before Repair Photo" required={needsPhotos} file={beforePhoto} onChange={setBeforePhoto} />
        <UploadField label="After Repair Photo" required={needsPhotos} file={afterPhoto} onChange={setAfterPhoto} />
      </div>

      {error && <p className="service-error">{error}</p>}

      <button
        type="submit"
        className="btn btn-primary service-submit"
        disabled={submitting || !vin.trim() || !invoicePhoto}
      >
        {submitting && <Loader2 size={18} className="spin" />}
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}
