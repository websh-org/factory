
. "$(dirname "$0")/includes/helpers.sh"

ROOT=$(parent_of_script)
DIST=$ROOT/dist

cd $ROOT;

PACKAGE=$(json_get $ROOT/real.package.json name) 
echo Bulding package $(tput bold)$PACKAGE$(tput sgr0)



announce "Is the working directory clean?"
is_git_clean && ok || abort "Working directory must be clean.";

announce "Preparing the dist directory in $DIST"
{
  rm -rf $DIST;
  mkdir $DIST;
  cp $ROOT/README.md $DIST;
  cp $ROOT/LICENSE.md $DIST;
  cp $ROOT/real.package.json $DIST/package.json;
} && ok || abort

# Build this particular package in the dist directory
## Customize as necessary.

build_package;
success "$PACKAGE built in $DIST"
success "$(tput bold)All done.$(tput sgr0)"
