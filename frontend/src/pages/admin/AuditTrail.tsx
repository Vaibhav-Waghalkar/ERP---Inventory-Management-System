import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Download, FileText, User, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { getAuditLogs, getAuditStats } from '../../services/audit.service';
import { EditLog } from '../../types';
import { format, subDays } from 'date-fns';

const entityTypes = ['StoreEntry', 'Distribution', 'UsageLog', 'DepartmentStock'];

export const AuditTrail = () => {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['audit-logs', startDate, endDate, entityTypeFilter],
    queryFn: () => getAuditLogs({
      startDate,
      endDate,
      entityType: entityTypeFilter || undefined,
    }),
  });

  const { data: stats } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: () => getAuditStats(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load audit trail" />;
  }

  const filteredLogs = logs?.filter((log) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.entityType.toLowerCase().includes(search) ||
      log.entityId.toLowerCase().includes(search) ||
      log.fieldName.toLowerCase().includes(search) ||
      log.editedBy?.fullName.toLowerCase().includes(search) ||
      log.editedBy?.email.toLowerCase().includes(search) ||
      log.reason?.toLowerCase().includes(search)
    );
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Audit Trail</h1>
          <p className="text-gray-600 mt-1">Complete activity log of all system changes</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Logs
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalLogs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Entity Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.byEntityType.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Active Editors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.topUsers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.recentActivity.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
              <select
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">All Types</option>
                {entityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Entity</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Field</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Change</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Edited By</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {format(new Date(log.editedAt), 'dd MMM yyyy, hh:mm a')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-medium text-gray-900">{log.entityType}</span>
                          <div className="text-xs text-gray-500">{log.entityId.substring(0, 8)}...</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-700">{log.fieldName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {log.oldValue && (
                            <span className="text-red-600 line-through mr-2">{log.oldValue}</span>
                          )}
                          <span className="text-gray-400">→</span>
                          {log.newValue && (
                            <span className="text-green-600 ml-2">{log.newValue}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">{log.editedBy?.fullName || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{log.editedBy?.email || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-700 truncate" title={log.reason || 'No reason provided'}>
                            {log.reason || 'N/A'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No audit logs found</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

