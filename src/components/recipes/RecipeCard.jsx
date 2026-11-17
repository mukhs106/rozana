import { Link } from "@tanstack/react-router";
import HeatMeter from "@/components/HeatMeter";
import { Image } from "@/components/ui/image";
import { cookMinutesOf, heatOf } from "@/lib/foodInfo";
import { cn } from "@/lib/utils";

// Footer fields follow the dish: olive for greens, portobello for chickpea
// gravies, turmeric for dal, fired clay for potato and cauliflower. The type
// colours are fixed, because the fields themselves never change with the theme.
const FIELDS = [
  { field: "bg-olive", type: "text-field-paper" },
  { field: "bg-portobello", type: "text-field-paper" },
  { field: "bg-turmeric", type: "text-field-ink" },
  { field: "bg-fired", type: "text-field-paper" },
];

const DISH_FIELDS = [
  { match: /palak|spinach|saag|greens|methi|bhaji|dill/i, index: 0 },
  { match: /chana|chickpea|rajma|bean|korma|makhani/i, index: 1 },
  { match: /dal|daal|lentil|rice|pulao|pongal|turmeric/i, index: 2 },
  { match: /aloo|potato|gobi|cauliflower|bhindi|okra|baingan/i, index: 3 },
];

function fieldFor(recipe) {
  const title = String(recipe.title || "");
  const known = DISH_FIELDS.find((entry) => entry.match.test(title));
  if (known) return FIELDS[known.index];
  const key = String(recipe.id || title);
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash + key.charCodeAt(i) * (i + 7)) % 9973;
  return FIELDS[hash % FIELDS.length];
}

export default function RecipeCard({ recipe, callout }) {
  const field = fieldFor(recipe);
  const heat = heatOf(recipe);
  const minutes = cookMinutesOf(recipe);
  const versionCount = recipe.variations?.length || 0;

  return (
    <Link to="/recipes/$recipeId" params={{ recipeId: recipe.id }} className="group block">
      <div className="overflow-hidden rounded-[8px]">
        <Image
          src={recipe.image_url}
          alt={recipe.title}
          className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <div className={cn("px-3 pb-2.5 pt-2", field.field, field.type)}>
          <h3 className="truncate font-serif text-[17px] leading-tight">{recipe.title}</h3>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="num text-[11.5px]">Serves {recipe.base_servings}</span>
            <HeatMeter level={heat.level} />
          </div>
        </div>
      </div>

      <p className="num mt-1.5 text-[12px] text-ink-mid">
        {[minutes ? `${minutes} min` : null, versionCount > 1 ? `${versionCount} versions` : null]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {callout ? <p className="mt-0.5 text-[12px] leading-snug text-oxblood">{callout}</p> : null}
    </Link>
  );
}