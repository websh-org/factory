
. "$(dirname "$0")/includes/helpers.sh"

ROOT=$(parent_of_script)
DIST=$ROOT/dist

cd $ROOT;

PACKAGE=$(json_get $ROOT/real.package.json name) 
echo Bulding package $(tput bold)$PACKAGE$(tput sgr0)

ensure_git_clean;
success "Working directory clean."
success "Building in $(tput bold)$DIST$(tput sgr0)"

## prepare the dist directory
rm -rf $DIST
mkdir $DIST
cp $ROOT/README.md $DIST
cp $ROOT/LICENSE.md $DIST
cp $ROOT/real.package.json $DIST/package.json

# Build this particular package in the dist directory
## Customize as necessary.

build_package;
success "$PACKAGE built in $DIST"
success "$(tput bold)All done.$(tput sgr0)"
