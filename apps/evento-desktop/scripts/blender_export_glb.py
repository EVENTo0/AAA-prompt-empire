import argparse
import sys

import bpy


def parse_args():
    argv = sys.argv
    extra = argv[argv.index("--") + 1:] if "--" in argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    return parser.parse_args(extra)


def main():
    args = parse_args()
    bpy.ops.export_scene.gltf(
        filepath=args.output,
        export_format="GLB",
        use_selection=False,
    )
    print("EVENTO_GLTF_EXPORT_OK", args.output)


if __name__ == "__main__":
    main()
