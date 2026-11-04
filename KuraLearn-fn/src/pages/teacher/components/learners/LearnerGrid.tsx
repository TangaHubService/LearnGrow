import { Eye, Edit3, Heart, Phone, Shield } from "lucide-react";
import { Card, Button } from "../../teacherShared";
import { StatusBadge } from "@/components/ModernUi";

interface LearnerGridProps {
  items: any[];
  onViewDetails: (item: any) => void;
  onEdit: (item: any) => void;
}

export function LearnerGrid({ items, onViewDetails, onEdit }: LearnerGridProps) {
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const parentName = item.parents?.[0]?.parent?.user?.name || "No parent linked";
        const parentPhone = item.parents?.[0]?.parent?.phone;
        const initials = getInitials(item.user?.name || "Student");
        const status = item.status || "ACTIVE";

        return (
          <Card
            key={item.id}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-200 hover:shadow-md"
          >
            <div>
              {/* Header: Avatar, Name and Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold text-white shadow-inner uppercase transition-transform group-hover:scale-105"
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
                    <h3 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-purple-700 transition-colors">
                      {item.user?.name}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                      {item.studentCode || "No Code"}
                    </p>
                  </div>
                </div>
                <StatusBadge value={status} tone={getStatusTone(status)} />
              </div>

              {/* Information Badges/Toggles */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-600">
                  {item.class?.name || "No class"}
                </span>
                {item.stream && (
                  <span className="inline-flex items-center rounded-lg bg-purple-50 px-2 py-1 text-[11px] font-bold text-purple-600">
                    Stream {item.stream}
                  </span>
                )}
                <span className="inline-flex items-center rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-600 uppercase">
                  {item.gender}
                </span>
                {item.hasDisability && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600">
                    <Heart size={10} fill="currentColor" />
                    IE Support
                  </span>
                )}
              </div>

              {/* Parent/Guardian Details */}
              <div className="mt-4 border-t border-slate-50 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Parent / Guardian
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-700">{parentName}</p>
                    {parentPhone && (
                      <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone size={10} />
                        {parentPhone}
                      </p>
                    )}
                  </div>
                  {parentPhone && (
                    <a
                      href={`tel:${parentPhone}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-purple-50 hover:text-purple-600 active:scale-95 transition-all"
                      title="Call Parent"
                    >
                      <Phone size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-5 flex gap-2 border-t border-slate-50 pt-3.5">
              <Button
                variant="secondary"
                onClick={() => onViewDetails(item)}
                className="h-8.5 flex-1 rounded-xl text-xs font-bold gap-1 border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <Eye size={13} />
                Details
              </Button>
              <Button
                variant="secondary"
                onClick={() => onEdit(item)}
                className="h-8.5 flex-1 rounded-xl text-xs font-bold gap-1 border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <Edit3 size={13} />
                Edit
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
