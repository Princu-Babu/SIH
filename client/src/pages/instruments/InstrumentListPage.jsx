import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { FiPlus, FiSearch, FiSliders, FiEye, FiEdit2 } from 'react-icons/fi';

import apiClient from '../../hooks/useApi';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';

export default function InstrumentListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isInspector } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const { data: instruments, isLoading } = useQuery({
    queryKey: ['instruments'],
    queryFn: async () => {
      const res = await apiClient.get('/instruments');
      const list = res.data?.data || res.data?.instruments || (Array.isArray(res.data) ? res.data : []);
      return list.map((item) => ({
        ...item,
        verificationScaleInterval_e: item.verificationInterval ?? item.verificationScaleInterval_e,
        actualScaleInterval_d: item.actualInterval ?? item.actualScaleInterval_d,
        instrumentType: item.type ?? item.instrumentType,
      }));
    },
  });

  // Filter instruments
  const filteredInstruments = useMemo(() => {
    if (!instruments) return [];
    return instruments.filter((item) => {
      const matchesSearch =
        searchTerm === '' ||
        item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClass = selectedClass === '' || item.accuracyClass === selectedClass;
      const matchesType = selectedType === '' || item.instrumentType === selectedType;

      return matchesSearch && matchesClass && matchesType;
    });
  }, [instruments, searchTerm, selectedClass, selectedType]);

  const columns = [
    {
      header: t('common.sNo', 'S.No'),
      render: (_, idx) => idx + 1,
      cellClass: 'text-xs font-semibold text-slate-500 w-12 text-center',
    },
    {
      header: 'Model / Serial No',
      accessor: 'model',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{row.model}</div>
          <div className="text-[11px] text-slate-500 font-mono">S/N: {row.serialNumber}</div>
        </div>
      ),
    },
    {
      header: 'Manufacturer',
      accessor: 'manufacturer',
      sortable: true,
      cellClass: 'text-xs text-slate-700 font-medium',
    },
    {
      header: 'Accuracy Class',
      accessor: 'accuracyClass',
      sortable: true,
      render: (row) => {
        const classNames = {
          CLASS_I: 'Class I (Special)',
          CLASS_II: 'Class II (High)',
          CLASS_III: 'Class III (Medium)',
          CLASS_IIII: 'Class IIII (Ordinary)',
        };
        return (
          <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-slate-100 text-[#1e3a5f] border border-slate-300">
            {classNames[row.accuracyClass] || row.accuracyClass}
          </span>
        );
      },
    },
    {
      header: 'Capacity (Max / Min)',
      accessor: 'maxCapacity',
      sortable: true,
      render: (row) => (
        <div className="text-xs text-slate-800">
          <span className="font-bold">{row.maxCapacity}</span> {row.unit}
          <div className="text-[11px] text-slate-500">Min: {row.minCapacity} {row.unit}</div>
        </div>
      ),
    },
    {
      header: 'Intervals (e / d)',
      accessor: 'verificationScaleInterval_e',
      render: (row) => (
        <div className="text-xs text-slate-700">
          e: <span className="font-semibold">{row.verificationScaleInterval_e}</span> {row.unit}
          <div className="text-[11px] text-slate-500">d: {row.actualScaleInterval_d} {row.unit}</div>
        </div>
      ),
    },
    {
      header: 'Location',
      accessor: 'location',
      cellClass: 'text-xs text-slate-600 max-w-xs truncate',
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        <StatusBadge status={row.isActive !== false ? 'ACTIVE' : 'INACTIVE'} size="xs" />
      ),
    },
    {
      header: t('common.actions', 'Actions'),
      cellClass: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/instruments/${row.id}`);
            }}
            className="p-1.5 text-primary-700 bg-primary-50 hover:bg-primary-100 rounded border border-primary-200"
            title="View Details"
          >
            <FiEye className="w-3.5 h-3.5" />
          </button>
          {isInspector && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/instruments/${row.id}/edit`);
              }}
              className="p-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300"
              title="Edit Instrument"
            >
              <FiEdit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('instruments.title', 'Instrument Registry')}
        subtitle={t('instruments.subtitle', 'Manage all registered weighing instruments and metrological parameters')}
        actions={
          isInspector && (
            <button
              type="button"
              onClick={() => navigate('/instruments/new')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-primary-600 rounded shadow-sm hover:bg-primary-700 transition-colors"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span>{t('instruments.registerBtn', '+ Register Instrument')}</span>
            </button>
          )
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by serial no, model, location..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Accuracy Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            aria-label="Filter by Accuracy Class"
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Accuracy Classes</option>
            <option value="CLASS_I">Class I (Special)</option>
            <option value="CLASS_II">Class II (High)</option>
            <option value="CLASS_III">Class III (Medium)</option>
            <option value="CLASS_IIII">Class IIII (Ordinary)</option>
          </select>

          {/* Instrument Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            aria-label="Filter by Instrument Type"
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Instrument Types</option>
            <option value="ELECTRONIC_SCALE">Electronic Scale</option>
            <option value="PLATFORM_SCALE">Platform Scale</option>
            <option value="TRUCK_WEIGHBRIDGE">Truck Weighbridge</option>
            <option value="LABORATORY_BALANCE">Laboratory Balance</option>
            <option value="PRECISION_BALANCE">Precision Balance</option>
            <option value="CRANE_SCALE">Crane Scale</option>
          </select>

          {(searchTerm || selectedClass || selectedType) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedClass('');
                setSelectedType('');
              }}
              className="text-xs font-semibold text-red-600 hover:text-red-800 px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table Component */}
      <DataTable
        columns={columns}
        data={filteredInstruments}
        isLoading={isLoading}
        emptyMessage="No instruments registered matching the specified criteria."
        pageSize={10}
        onRowClick={(row) => navigate(`/instruments/${row.id}`)}
      />
    </div>
  );
}
