import { formatDateWithDay, formatTo12Hour } from "../../../../utility/DateFormats";
import { inspectionTypesMap } from "../../../../Data/DropdownData";
import { ppeRecord } from "../../../../Data/IncidentsData";

const ViewDetailsPgi = ({ inspection }: any) => {

  return (
    <div className="space-y-5">


      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 text-gray-700">
        <div>
          <p className="font-medium text-lg mb-0.5">Site</p>
          <p className="text-base">{inspection.site}</p>
        </div>
        <div>
          <p className="font-medium text-lg mb-0.5">Planned Date</p>
          <p className="text-base">{formatDateWithDay(inspection.plannedDate)}</p>
        </div>
        <div>
          <p className="font-medium text-lg mb-0.5">Time</p>
          <p className="text-base">{formatTo12Hour(inspection.startTime)} - {formatTo12Hour(inspection.endTime)}</p>
        </div>
      </div>

      {/* Description */}
      <div>
        <p className="font-medium text-lg mb-0.5">Description</p>
        <p
          dangerouslySetInnerHTML={{ __html: inspection.description }}
          className="text-gray-500 text-base"
        />
      </div>

      {/* Objectives */}
      <div>
        <p className="font-medium text-lg mb-0.5">Objectives</p>
        <p className="text-gray-500 text-base">{inspection.objectives}</p>
      </div>

      {/* Risk Types */}
      <div>
        <p className="font-medium text-lg mb-1">Risk Types</p>
        <div className="flex gap-1.5 mt-0.5 flex-wrap">
          {inspection.riskTypes?.map((x: any, index: any) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-base font-normal"
            >
              {inspectionTypesMap[x]}
            </span>
          ))}
        </div>
      </div>

      {/* Inspectors */}
      <div>
        <p className="font-medium text-lg mb-2">Inspectors</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {inspection.participants?.map((emp: any, index: number) => {
            const initials = emp?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition duration-200 shadow-sm border border-purple-100"
              >
                <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 font-bold text-base">
                  {initials || 'NA'}
                </div>
                <div>
                  <p className="text-purple-600 font-semibold text-base">{emp?.name || 'Unknown'}</p>
                  <p className="text-gray-500 text-sm">{emp?.role ? emp.role : 'No role available'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Required PPE */}
      <div>
        <p className="font-medium text-lg mb-2">Required PPE</p>
        <div className="flex flex-wrap gap-1.5">
          {inspection.ppe?.map((x: any, index: any) => (
            <div
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-sm font-medium shadow-sm hover:bg-orange-200 transition"
            >
              {ppeRecord[x]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewDetailsPgi;