# nx-cacher-cli
### custom nx cache like re-implementation for NX Monorepos

# How to use
Run 
```shell
npm i -g git+https://github.com/xsip/nx-cacher-cli.git
```

Checkout the previous commit in your pipeline and run
```shell
nx-cacher-cli output <tmp_dir>/<filename>.json
```

After that go back to your current commit and run
```shell
nx-cacher-cli compare <tmp_dir>/<filename>.json
```

This will print out all projects needed to test, build, or whatever you wanna do with them.

# Sample Git Actions pipeline

```yaml
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci --legacy-peer-deps
      - run: git stash
      - run: git checkout "${GITHUB_REF:11}"
      - run: git checkout HEAD~1
      - run: nx-cacher-cli output ${{ runner.temp }}/old-cache.json
      - run: git checkout "${GITHUB_REF:11}"
      - run: echo "TARGETS= $(nx-cacher-cli compare ${{ runner.temp }}/old-cache.json)" >> $GITHUB_ENV
      - run: if [ "${{env.TARGETS}}" ]; then npx nx run-many -t build -p ${{env.TARGETS}} --parallel=5; fi

```