import { useEffect, useState } from "react";
import { Provinces, Districts, Sectors, Cells, Villages } from "rwanda";
import { CustomDropdown } from "./ModernUi";

export type LocationData = {
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
};

export type LocationErrors = {
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
};

export function RwandaLocationSelector({
  value,
  onChange,
  disabled,
  errors,
  requiredLevels = ["province", "district", "sector"],
}: {
  value: LocationData;
  onChange: (value: LocationData) => void;
  disabled?: boolean;
  errors?: LocationErrors;
  requiredLevels?: ("province" | "district" | "sector" | "cell" | "village")[];
}) {
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [cells, setCells] = useState<string[]>([]);
  const [villages, setVillages] = useState<string[]>([]);

  // Load provinces on mount
  useEffect(() => {
    try {
      const data = Provinces();
      setProvinces(data || []);
    } catch (err) {
      console.error("Failed to load provinces:", err);
      setProvinces([]);
    }
  }, []);

  // Cascading logic: Province -> District
  useEffect(() => {
    if (value.province) {
      try {
        const data = Districts(value.province);
        setDistricts(data || []);
      } catch {
        setDistricts([]);
      }
    } else {
      setDistricts([]);
    }
  }, [value.province]);

  // Cascading logic: District -> Sector
  useEffect(() => {
    if (value.province && value.district) {
      try {
        const data = Sectors(value.province, value.district);
        setSectors(data || []);
      } catch {
        setSectors([]);
      }
    } else {
      setSectors([]);
    }
  }, [value.province, value.district]);

  // Cascading logic: Sector -> Cell
  useEffect(() => {
    if (value.province && value.district && value.sector) {
      try {
        const data = Cells(value.province, value.district, value.sector);
        setCells(data || []);
      } catch {
        setCells([]);
      }
    } else {
      setCells([]);
    }
  }, [value.province, value.district, value.sector]);

  // Cascading logic: Cell -> Village
  useEffect(() => {
    if (value.province && value.district && value.sector && value.cell) {
      try {
        const data = Villages(value.province, value.district, value.sector, value.cell);
        setVillages(data || []);
      } catch {
        setVillages([]);
      }
    } else {
      setVillages([]);
    }
  }, [value.province, value.district, value.sector, value.cell]);

  const mapToOptions = (items: string[]) => items.map((i) => ({ label: i, value: i }));

  const handleProvinceChange = (province?: string) => {
    onChange({
      province,
      district: undefined,
      sector: undefined,
      cell: undefined,
      village: undefined,
    });
  };

  const handleDistrictChange = (district?: string) => {
    onChange({
      ...value,
      district,
      sector: undefined,
      cell: undefined,
      village: undefined,
    });
  };

  const handleSectorChange = (sector?: string) => {
    onChange({
      ...value,
      sector,
      cell: undefined,
      village: undefined,
    });
  };

  const handleCellChange = (cell?: string) => {
    onChange({
      ...value,
      cell,
      village: undefined,
    });
  };

  const handleVillageChange = (village?: string) => {
    onChange({
      ...value,
      village,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <CustomDropdown
          label={`Province ${requiredLevels.includes("province") ? "*" : ""}`}
          placeholder="Select Province"
          options={mapToOptions(provinces)}
          value={value.province}
          onChange={handleProvinceChange}
          disabled={disabled || provinces.length === 0}
          error={errors?.province}
          emptyMessage="No provinces found."
        />

        <CustomDropdown
          label={`District ${requiredLevels.includes("district") ? "*" : ""}`}
          placeholder="Select District"
          options={mapToOptions(districts)}
          value={value.district}
          onChange={handleDistrictChange}
          disabled={disabled || !value.province || districts.length === 0}
          error={errors?.district}
          emptyMessage={value.province ? "No districts found." : "Select a province first."}
        />

        <CustomDropdown
          label={`Sector ${requiredLevels.includes("sector") ? "*" : ""}`}
          placeholder="Select Sector"
          options={mapToOptions(sectors)}
          value={value.sector}
          onChange={handleSectorChange}
          disabled={disabled || !value.district || sectors.length === 0}
          error={errors?.sector}
          emptyMessage={value.district ? "No sectors found." : "Select a district first."}
        />

        <CustomDropdown
          label={`Cell ${requiredLevels.includes("cell") ? "*" : ""}`}
          placeholder="Select Cell"
          options={mapToOptions(cells)}
          value={value.cell}
          onChange={handleCellChange}
          disabled={disabled || !value.sector || cells.length === 0}
          error={errors?.cell}
          emptyMessage={value.sector ? "No cells found." : "Select a sector first."}
        />

        <CustomDropdown
          label={`Village ${requiredLevels.includes("village") ? "*" : ""}`}
          placeholder="Select Village"
          options={mapToOptions(villages)}
          value={value.village}
          onChange={handleVillageChange}
          disabled={disabled || !value.cell || villages.length === 0}
          error={errors?.village}
          emptyMessage={value.cell ? "No villages found." : "Select a cell first."}
        />
      </div>
    </div>
  );
}
