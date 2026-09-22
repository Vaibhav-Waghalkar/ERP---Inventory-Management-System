import { X, Clock } from 'lucide-react';
import { EditLog } from '../../types';
import { format } from 'date-fns';

interface EditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editLogs: EditLog[];
  entityName?: string;
}

export const EditHistoryModal = ({ isOpen, onClose, editLogs, entityName }: EditHistoryModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900">
                Edit History {entityName && `- ${entityName}`}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Complete history of all changes made to this record
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {editLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No edit history available</p>
              <p className="text-sm mt-2">This record has not been modified</p>
            </div>
          ) : (
            <div className="space-y-4">
              {editLogs.map((log, index) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {format(new Date(log.editedAt), 'dd MMM yyyy, hh:mm a')}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">#{editLogs.length - index}</span>
                  </div>

                  <div className="mb-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Edited by:</span>{' '}
                      {log.editedBy?.fullName || 'Unknown'} ({log.editedBy?.email || 'N/A'})
                    </p>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Changes Made:</p>
                    <div className="bg-gray-50 rounded p-3 space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-gray-600 min-w-[100px]">
                          {log.fieldName}:
                        </span>
                        <div className="flex-1">
                          {log.oldValue && (
                            <span className="text-sm text-red-600 line-through mr-2">
                              {log.oldValue}
                            </span>
                          )}
                          <span className="text-sm text-gray-700">→</span>
                          {log.newValue && (
                            <span className="text-sm text-green-600 ml-2">
                              {log.newValue}
                            </span>
                          )}
                          {!log.oldValue && log.newValue && (
                            <span className="text-xs text-gray-500 ml-2">(Added)</span>
                          )}
                          {log.oldValue && !log.newValue && (
                            <span className="text-xs text-gray-500 ml-2">(Removed)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {log.reason && (
                    <div className="border-t pt-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">Reason for Edit:</p>
                      <p className="text-sm text-gray-700 italic bg-blue-50 p-2 rounded">
                        {log.reason}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="btn btn-outline">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

