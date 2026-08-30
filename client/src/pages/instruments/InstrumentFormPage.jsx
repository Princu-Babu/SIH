import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FiSave, FiX, FiInfo } from 'react-icons/fi';

import apiClient from '../../hooks/useApi';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function InstrumentFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    model: '',
    manufacturer: '',
    instrumentType: 'ELECTRONIC_SCALE',
    accuracyClass: 'CLASS_III',
    maxCapacity: '',
    minCapacity: '',
    verificationScaleInterval_e: '',
    actualScaleInterval_d: '',
    unit: 'kg',
    location: '',
    verificationType: 'INITIAL',
    tareType: 'SUBTRACTIVE',
    maxTare: '',
    tempRangeMin: 10,
    tempRangeMax: 40,
  });

  useEffect(() => {
    if (isEdit && id) {
      const fetchInstrument = async () => {
        try {
          setIsLoading(true);
          const res = await apiClient.get(`/instruments/${id}`);
          const inst = res.data;
          setFormData({
            name: inst.name || '',
            serialNumber: inst.serialNumber || '',
            model: inst.model || '',
            manufacturer: inst.manufacturer || '',
            instrumentType: inst.type || 'ELECTRONIC_SCALE',
            accuracyClass: inst.accuracyClass || 'CLASS_III',
            maxCapacity: inst.maxCapacity ?? '',
            minCapacity: inst.minCapacity ?? '',
            verificationScaleInterval_e: inst.verificationInterval ?? '',
            actualScaleInterval_d: inst.actualInterval ?? '',
            unit: inst.unit || 'kg',
            location: inst.location || '',
            verificationType: inst.verificationType || 'INITIAL',
            tareType: inst.tareType || 'SUBTRACTIVE',
            maxTare: inst.maxTare ?? '',
            tempRangeMin: inst.tempRangeMin ?? 10,
            tempRangeMax: inst.tempRangeMax ?? 40,
          });
        } catch (err) {
          toast.error('Failed to load instrument details.');
          navigate('/instruments');
        } finally {
          setIsLoading(false);
        }
      };
      fetchInstrument();
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Instrument name is required';
    if (!formData.serialNumber.trim()) errs.serialNumber = 'Serial number is required';
    if (!formData.model.trim()) errs.model = 'Model name is required';
    if (!formData.manufacturer.trim()) errs.manufacturer = 'Manufacturer is required';
    if (!formData.location.trim()) errs.location = 'Location / premise is required';

    const maxCap = Number(formData.maxCapacity);
    const minCap = Number(formData.minCapacity);
    const e = Number(formData.verificationScaleInterval_e);
    const d = Number(formData.actualScaleInterval_d);

    if (isNaN(maxCap) || maxCap <= 0) errs.maxCapacity = 'Valid Max capacity is required';
    if (isNaN(minCap) || minCap < 0) errs.minCapacity = 'Valid Min capacity is required';
    if (minCap >= maxCap) errs.minCapacity = 'Min capacity must be less than Max capacity';
    if (isNaN(e) || e <= 0) errs.verificationScaleInterval_e = 'Valid interval (e) is required';
    if (isNaN(d) || d <= 0) errs.actualScaleInterval_d = 'Valid interval (d) is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please resolve validation errors before saving.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name,
        type: formData.instrumentType,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serialNumber: formData.serialNumber,
        accuracyClass: formData.accuracyClass,
        maxCapacity: Number(formData.maxCapacity),
        minCapacity: Number(formData.minCapacity),
        verificationInterval: Number(formData.verificationScaleInterval_e),
        actualInterval: Number(formData.actualScaleInterval_d),
        unit: formData.unit,
        location: formData.location,
      };

      if (isEdit) {
        await apiClient.put(`/instruments/${id}`, payload);
        toast.success(t('instruments.updatedSuccess', 'Instrument updated successfully'));
      } else {
        await apiClient.post('/instruments', payload);
        toast.success(t('instruments.createdSuccess', 'Instrument registered successfully'));
      }
      navigate('/instruments');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error saving instrument';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12">
        <LoadingSpinner message="Loading instrument details..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={
          isEdit
            ? t('instruments.editTitle', 'Edit Instrument')
            : t('instruments.registerTitle', 'Register New Instrument')
        }
        subtitle="OIML R-76 metrological specification & identification"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Basic Information */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#1e3a5f] border-b border-slate-100 pb-2">
            {t('instruments.basicInfo', '1. Basic Information')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                Instrument Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Precision Laboratory Balance"
                className={`w-full px-3 py-2 text-xs bg-white border ${
                  errors.name ? 'border-red-400' : 'border-slate-300'
                } rounded focus:outline-none focus:ring-1 focus:ring-primary-500`}
              />
              {errors.name && (
                <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="serialNumber"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                Serial Number *
              </label>
              <input
                id="serialNumber"
                name="serialNumber"
                type="text"
                required
                value={formData.serialNumber}
                onChange={handleChange}
                placeholder="e.g. RAD-2024-9981"
                className={`w-full px-3 py-2 text-xs bg-white border ${
                  errors.serialNumber ? 'border-red-400' : 'border-slate-300'
                } rounded focus:outline-none focus:ring-1 focus:ring-primary-500`}
              />
              {errors.serialNumber && (
                <p className="text-[11px] text-red-600 mt-1">{errors.serialNumber}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="model"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                Model Name / Number *
              </label>
              <input
                id="model"
                name="model"
                type="text"
                required
                value={formData.model}
                onChange={handleChange}
                placeholder="e.g. Radwag XA 220.4Y"
                className={`w-full px-3 py-2 text-xs bg-white border ${
                  errors.model ? 'border-red-400' : 'border-slate-300'
                } rounded focus:outline-none focus:ring-1 focus:ring-primary-500`}
              />
              {errors.model && <p className="text-[11px] text-red-600 mt-1">{errors.model}</p>}
            </div>

            <div>
              <label
                htmlFor="manufacturer"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                Manufacturer *
              </label>
              <input
                id="manufacturer"
                name="manufacturer"
                type="text"
                required
                value={formData.manufacturer}
                onChange={handleChange}
                placeholder="e.g. Radwag Metrology / Mettler Toledo"
                className={`w-full px-3 py-2 text-xs bg-white border ${
                  errors.manufacturer ? 'border-red-400' : 'border-slate-300'
                } rounded focus:outline-none focus:ring-1 focus:ring-primary-500`}
              />
              {errors.manufacturer && (
                <p className="text-[11px] text-red-600 mt-1">{errors.manufacturer}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="instrumentType"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                Instrument Type *
              </label>
              <select
                id="instrumentType"
                name="instrumentType"
                value={formData.instrumentType}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 font-medium"
              >
                <option value="ELECTRONIC_SCALE">Electronic Scale</option>
                <option value="PLATFORM_SCALE">Platform Scale</option>
                <option value="TRUCK_WEIGHBRIDGE">Truck Weighbridge</option>
                <option value="LABORATORY_BALANCE">Laboratory Balance</option>
                <option value="PRECISION_BALANCE">Precision Balance</option>
                <option value="CRANE_SCALE">Crane Scale</option>
                <option value="BENCH_SCALE">Bench Scale</option>
                <option value="OTHER">Other NAWI</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Metrological Parameters */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-[#1e3a5f]">
              {t('instruments.metrologicalParams', '2. Metrological Parameters (OIML R-76)')}
            </h2>
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <FiInfo className="w-3.5 h-3.5 text-primary-600" />
              Governs MPE calculation and zone limits
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="accuracyClass"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                Accuracy Class *
              </label>
              <select
                id="accuracyClass"
                name="accuracyClass"
                value={formData.accuracyClass}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold text-primary-700"
              >
                <option value="CLASS_I">Class I (Special Accuracy)</option>
                <option value="CLASS_II">Class II (High Accuracy)</option>
                <option value="CLASS_III">Class III (Medium Accuracy)</option>
                <option value="CLASS_IIII">Class IIII (Ordinary Accuracy)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="unit"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                Mass Unit *
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="g">Grams (g)</option>
                <option value="mg">Milligrams (mg)</option>
                <option value="t">Metric Tonnes (t)</option>
                <option value="ct">Carats (ct)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="verificationType"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                Verification Type *
              </label>
              <select
                id="verificationType"
                name="verificationType"
                value={formData.verificationType}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 font-medium"
              >
                <option value="INITIAL">Initial Verification (1x MPE)</option>
                <option value="IN_SERVICE">In-Service Verification (2x MPE)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="maxCapacity"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                Max Capacity (Max) *
              </label>
              <input
                id="maxCapacity"
                name="maxCapacity"
                type="number"
                step="any"
                required
                value={formData.maxCapacity}
                onChange={handleChange}
                placeholder={`e.g. 150 (${formData.unit})`}
                className={`w-full px-3 py-2 text-xs bg-white border ${
                  errors.maxCapacity ? 'border-red-400' : 'border-slate-300'
                } rounded focus:outline-none focus:ring-1 focus:ring-primary-500`}
              />
              {errors.maxCapacity && (
                <p className="text-[11px] text-red-600 mt-1">{errors.maxCapacity}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="minCapacity"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                Min Capacity (Min) *
              </label>
              <input
                id="minCapacity"
                name="minCapacity"
                type="number"
                step="any"
                required
                value={formData.minCapacity}
                onChange={handleChange}
                placeholder={`e.g. 1 (${formData.unit})`}
                className={`w-full px-3 py-2 text-xs bg-white border ${
                  errors.minCapacity ? 'border-red-400' : 'border-slate-300'
                } rounded focus:outline-none focus:ring-1 focus:ring-primary-500`}
              />
              {errors.minCapacity && (
                <p className="text-[11px] text-red-600 mt-1">{errors.minCapacity}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="verificationScaleInterval_e"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                Verification Interval (e) *
              </label>
              <input
                id="verificationScaleInterval_e"
                name="verificationScaleInterval_e"
                type="number"
                step="any"
                required
                value={formData.verificationScaleInterval_e}
                onChange={handleChange}
                placeholder={`e.g. 0.05 (${formData.unit})`}
                className={`w-full px-3 py-2 text-xs bg-white border ${
                  errors.verificationScaleInterval_e ? 'border-red-400' : 'border-slate-300'
                } rounded focus:outline-none focus:ring-1 focus:ring-primary-500`}
              />
              {errors.verificationScaleInterval_e && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.verificationScaleInterval_e}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="actualScaleInterval_d"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                Actual Interval (d) *
              </label>
              <input
                id="actualScaleInterval_d"
                name="actualScaleInterval_d"
                type="number"
                step="any"
                required
                value={formData.actualScaleInterval_d}
                onChange={handleChange}
                placeholder={`e.g. 0.05 (${formData.unit})`}
                className={`w-full px-3 py-2 text-xs bg-white border ${
                  errors.actualScaleInterval_d ? 'border-red-400' : 'border-slate-300'
                } rounded focus:outline-none focus:ring-1 focus:ring-primary-500`}
              />
              {errors.actualScaleInterval_d && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.actualScaleInterval_d}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 3. Location & Deployment */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#1e3a5f] border-b border-slate-100 pb-2">
            {t('instruments.locationSection', '3. Deployment & Location')}
          </h2>

          <div>
            <label
              htmlFor="location"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
            >
              Premise / Physical Location *
            </label>
            <input
              id="location"
              name="location"
              type="text"
              required
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Mandi Agricultural Yard, Shed 4, Sector 18, Vashi, Navi Mumbai"
              className={`w-full px-3 py-2 text-xs bg-white border ${
                errors.location ? 'border-red-400' : 'border-slate-300'
              } rounded focus:outline-none focus:ring-1 focus:ring-primary-500`}
            />
            {errors.location && (
              <p className="text-[11px] text-red-600 mt-1">{errors.location}</p>
            )}
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/instruments')}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            <FiX className="w-3.5 h-3.5" />
            <span>{t('common.cancel', 'Cancel')}</span>
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-primary-600 rounded hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-60"
          >
            <FiSave className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving...' : t('common.save', 'Save Instrument')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
