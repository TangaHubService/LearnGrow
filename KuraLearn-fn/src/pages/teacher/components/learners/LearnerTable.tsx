import { Eye, Edit3, Heart, Phone } from "lucide-react";
import { StatusBadge } from "@/components/ModernUi";
import { Button } from "../../teacherShared";

interface LearnerTableProps {
  items: any[];
  onViewDetails: (item: any) => void;
  onEdit: (item: any) => void;
  page: number;
  pageSize: number;
}

export function LearnerTable({ items, onViewDetails, onEdit, page, pageSize }: LearnerTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getStatusTone = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "TRANSFERRED":
        return "warning";
      case "GRADUATED":
        return "info";
      case "DROPPED_OUT":
        return "error";
      default:
        return "neutral";
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div tabIndex={0} className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75">
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wide text-slate-500 w-12">
                #
              </th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Learner
              </th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Admission No
              </th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Class / Stream
              </th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Gender
              </th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Parent / Guardian
              </th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wide text-slate-500 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => {
              const parentName = item.parents?.[0]?.parent?.user?.name || "No parent linked";
              const parentPhone = item.parents?.[0]?.parent?.phone;
              const initials = getInitials(item.user?.name || "Student");
              const status = item.status || "ACTIVE";
              const serialNo = (page - 1) * pageSize + idx + 1;

              return (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-xs font-bold text-slate-500">
                    {serialNo}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-inner uppercase"
                        style={{
                          background: "linear-gradient(135deg, #a78bfa 0%, #6d3eeb 100%)",
                        }}
                      >
                        {item.avatar ? (
                          <img
                            src={item.avatar}
                            alt=""
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                          {item.user?.name}
                        </span>
                        {item.hasDisability && (
                          <span className="inline-flex items-center gap-1 rounded bg-red-50 px-1 py-0.5 text-[10px] font-bold text-red-600 mt-0.5">
                            <Heart size={8} fill="currentColor" />
                            IE Support
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-slate-500">
                    {item.studentCode || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="block text-sm font-bold text-slate-700">
                      {item.class?.name || "No class"}
                    </span>
                    {item.stream && (
                      <span className="text-[11px] font-bold text-purple-600">
                        Stream {item.stream}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-xs font-bold text-slate-600 uppercase">
                    {item.gender}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge value={status} tone={getStatusTone(status)} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-semibold text-slate-700">{parentName}</div>
                    {parentPhone && (
                      <div className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone size={10} />
                        {parentPhone}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="secondary"
                        onClick={() => onViewDetails(item)}
                        className="h-8.5 rounded-xl px-3 text-xs font-bold gap-1 border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        <Eye size={13} />
                        Details
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => onEdit(item)}
                        className="h-8.5 rounded-xl px-3 text-xs font-bold gap-1 border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        <Edit3 size={13} />
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
